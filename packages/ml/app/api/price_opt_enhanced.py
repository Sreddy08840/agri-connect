"""Enhanced price optimization API with A/B testing and bandit simulation."""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta

from ..db import db
from ..config import settings

router = APIRouter(prefix="/price-optimize", tags=["price-optimization"])


# Schemas
class PriceOptimizationRequest(BaseModel):
    """Request for price optimization."""
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    include_ab_tests: bool = Field(default=True, description="Include A/B test recommendations")


class ABTestPrice(BaseModel):
    """A/B test price variant."""
    price: float
    expected_demand: float
    expected_revenue: float
    confidence: float
    variant_name: str


class PriceOptimizationResponse(BaseModel):
    """Response for price optimization."""
    product_id: str
    current_price: float
    optimal_price: float
    expected_demand: float
    expected_revenue: float
    revenue_uplift_pct: float
    elasticity: float
    elasticity_interpretation: str
    confidence_interval: List[float]
    ab_test_variants: Optional[List[ABTestPrice]] = None
    model_metadata: Dict[str, Any]


class BanditSimulationRequest(BaseModel):
    """Request for bandit simulation."""
    n_days: int = Field(default=30, ge=7, le=90, description="Number of days to simulate")
    baseline_price: float = Field(description="Current/baseline price")
    test_prices: List[float] = Field(description="Alternative prices to test")
    algorithm: str = Field(default="thompson", description="thompson or epsilon_greedy")
    epsilon: float = Field(default=0.1, ge=0.0, le=1.0, description="Epsilon for epsilon-greedy")


class BanditSimulationResponse(BaseModel):
    """Response for bandit simulation."""
    product_id: str
    simulation_days: int
    algorithm: str
    results: Dict[str, Any]
    best_price: float
    expected_uplift_pct: float
    recommendation: str


class PriceExperimentConfig(BaseModel):
    """Configuration for price experiment."""
    product_id: str
    experiment_name: str
    baseline_price: float
    test_prices: List[float]
    traffic_split: List[float]
    duration_days: int
    success_metric: str = "revenue"


# Helper functions
def load_price_model(product_id: str):
    """Load trained price optimization model."""
    model_path = settings.model_dir / f"price_{product_id}.pkl"
    
    if not model_path.exists():
        return None
    
    try:
        return joblib.load(model_path)
    except Exception as e:
        print(f"Failed to load model: {e}")
        return None


def interpret_elasticity(elasticity: float) -> str:
    """Interpret price elasticity value."""
    if elasticity > -0.5:
        return "Inelastic (demand not very sensitive to price)"
    elif elasticity > -1.0:
        return "Moderately elastic"
    elif elasticity > -2.0:
        return "Elastic (demand sensitive to price)"
    else:
        return "Highly elastic (demand very sensitive to price)"


def predict_demand(price: float, model_data: dict, baseline_price: float = None) -> float:
    """
    Predict demand at a given price using elasticity model.
    
    Args:
        price: Price to predict demand for
        model_data: Loaded model data
        baseline_price: Reference price (uses current if None)
        
    Returns:
        Predicted demand
    """
    elasticity_params = model_data['elasticity_params']
    elasticity = elasticity_params['elasticity']
    
    if baseline_price is None:
        baseline_price = model_data['metadata']['current_price']
    
    # Get baseline demand
    optimization_result = model_data['optimization_result']
    baseline_demand = optimization_result['optimal_demand']
    optimal_price = optimization_result['optimal_price']
    
    # Predict demand using elasticity
    # demand(price) = baseline_demand * (price / baseline_price) ^ elasticity
    predicted_demand = baseline_demand * (price / optimal_price) ** elasticity
    
    return max(0, predicted_demand)


def generate_ab_test_variants(model_data: dict, n_variants: int = 3) -> List[Dict]:
    """
    Generate A/B test price variants around optimal price.
    
    Args:
        model_data: Loaded model data
        n_variants: Number of variants to generate
        
    Returns:
        List of variant dictionaries
    """
    optimal_price = model_data['metadata']['optimal_price']
    current_price = model_data['metadata']['current_price']
    
    # Generate variants: current, optimal, and intermediate prices
    variants = []
    
    # Variant A: Current price (control)
    demand_current = predict_demand(current_price, model_data)
    variants.append({
        'price': current_price,
        'expected_demand': demand_current,
        'expected_revenue': current_price * demand_current,
        'confidence': 0.9,  # High confidence (historical)
        'variant_name': 'A_control'
    })
    
    # Variant B: Optimal price
    demand_optimal = predict_demand(optimal_price, model_data)
    variants.append({
        'price': optimal_price,
        'expected_demand': demand_optimal,
        'expected_revenue': optimal_price * demand_optimal,
        'confidence': 0.75,  # Medium confidence (model prediction)
        'variant_name': 'B_optimal'
    })
    
    # Variant C: Intermediate price
    if n_variants >= 3:
        intermediate_price = (current_price + optimal_price) / 2
        demand_intermediate = predict_demand(intermediate_price, model_data)
        variants.append({
            'price': intermediate_price,
            'expected_demand': demand_intermediate,
            'expected_revenue': intermediate_price * demand_intermediate,
            'confidence': 0.8,
            'variant_name': 'C_intermediate'
        })
    
    # Additional variants if requested
    if n_variants >= 4:
        # Variant D: Conservative change (±5%)
        conservative_price = current_price * (1.05 if optimal_price > current_price else 0.95)
        demand_conservative = predict_demand(conservative_price, model_data)
        variants.append({
            'price': conservative_price,
            'expected_demand': demand_conservative,
            'expected_revenue': conservative_price * demand_conservative,
            'confidence': 0.85,
            'variant_name': 'D_conservative'
        })
    
    return variants


def simulate_thompson_sampling(product_id: str, model_data: dict, 
                               baseline_price: float, test_prices: List[float],
                               n_days: int) -> Dict:
    """
    Simulate Thompson Sampling (Bayesian bandit) for price testing.
    
    Args:
        product_id: Product ID
        model_data: Price model data
        baseline_price: Current price
        test_prices: Alternative prices to test
        n_days: Number of days to simulate
        
    Returns:
        Simulation results
    """
    prices = [baseline_price] + test_prices
    n_arms = len(prices)
    
    # Initialize Beta distributions for each arm (alpha, beta)
    # Start with uniform prior: Beta(1, 1)
    alphas = np.ones(n_arms)
    betas = np.ones(n_arms)
    
    # Track results
    pulls = np.zeros(n_arms)
    rewards = np.zeros(n_arms)
    daily_revenues = []
    
    # Simulate each day
    for day in range(n_days):
        # Sample from Beta distributions (Thompson Sampling)
        samples = np.random.beta(alphas, betas)
        
        # Select arm with highest sample
        chosen_arm = np.argmax(samples)
        chosen_price = prices[chosen_arm]
        
        # Simulate demand (with noise)
        expected_demand = predict_demand(chosen_price, model_data, baseline_price)
        actual_demand = max(0, np.random.poisson(expected_demand))
        
        # Calculate revenue
        revenue = chosen_price * actual_demand
        
        # Update statistics
        pulls[chosen_arm] += 1
        rewards[chosen_arm] += revenue
        daily_revenues.append(revenue)
        
        # Update Beta distribution
        # Success = revenue > baseline revenue
        baseline_revenue = baseline_price * predict_demand(baseline_price, model_data, baseline_price)
        if revenue > baseline_revenue:
            alphas[chosen_arm] += 1
        else:
            betas[chosen_arm] += 1
    
    # Calculate results
    avg_revenues = rewards / (pulls + 1e-10)
    best_arm = np.argmax(avg_revenues)
    best_price = prices[best_arm]
    
    baseline_revenue = baseline_price * predict_demand(baseline_price, model_data, baseline_price)
    total_revenue = sum(daily_revenues)
    expected_baseline_revenue = baseline_revenue * n_days
    uplift_pct = ((total_revenue - expected_baseline_revenue) / expected_baseline_revenue) * 100
    
    return {
        'prices': prices,
        'pulls': pulls.tolist(),
        'avg_revenues': avg_revenues.tolist(),
        'total_revenue': float(total_revenue),
        'expected_baseline_revenue': float(expected_baseline_revenue),
        'best_price': float(best_price),
        'uplift_pct': float(uplift_pct),
        'daily_revenues': daily_revenues
    }


def simulate_epsilon_greedy(product_id: str, model_data: dict,
                            baseline_price: float, test_prices: List[float],
                            n_days: int, epsilon: float = 0.1) -> Dict:
    """
    Simulate Epsilon-Greedy bandit for price testing.
    
    Args:
        product_id: Product ID
        model_data: Price model data
        baseline_price: Current price
        test_prices: Alternative prices to test
        n_days: Number of days to simulate
        epsilon: Exploration rate
        
    Returns:
        Simulation results
    """
    prices = [baseline_price] + test_prices
    n_arms = len(prices)
    
    # Track results
    pulls = np.zeros(n_arms)
    rewards = np.zeros(n_arms)
    daily_revenues = []
    
    # Simulate each day
    for day in range(n_days):
        # Epsilon-greedy selection
        if np.random.random() < epsilon:
            # Explore: random arm
            chosen_arm = np.random.randint(n_arms)
        else:
            # Exploit: best arm so far
            avg_rewards = rewards / (pulls + 1e-10)
            chosen_arm = np.argmax(avg_rewards)
        
        chosen_price = prices[chosen_arm]
        
        # Simulate demand (with noise)
        expected_demand = predict_demand(chosen_price, model_data, baseline_price)
        actual_demand = max(0, np.random.poisson(expected_demand))
        
        # Calculate revenue
        revenue = chosen_price * actual_demand
        
        # Update statistics
        pulls[chosen_arm] += 1
        rewards[chosen_arm] += revenue
        daily_revenues.append(revenue)
    
    # Calculate results
    avg_revenues = rewards / (pulls + 1e-10)
    best_arm = np.argmax(avg_revenues)
    best_price = prices[best_arm]
    
    baseline_revenue = baseline_price * predict_demand(baseline_price, model_data, baseline_price)
    total_revenue = sum(daily_revenues)
    expected_baseline_revenue = baseline_revenue * n_days
    uplift_pct = ((total_revenue - expected_baseline_revenue) / expected_baseline_revenue) * 100
    
    return {
        'prices': prices,
        'pulls': pulls.tolist(),
        'avg_revenues': avg_revenues.tolist(),
        'total_revenue': float(total_revenue),
        'expected_baseline_revenue': float(expected_baseline_revenue),
        'best_price': float(best_price),
        'uplift_pct': float(uplift_pct),
        'epsilon': epsilon,
        'daily_revenues': daily_revenues
    }


# API Endpoints
@router.post("/product/{product_id}", response_model=PriceOptimizationResponse)
async def optimize_product_price(
    product_id: str,
    request: PriceOptimizationRequest = Body(default=PriceOptimizationRequest())
):
    """
    Get optimal price recommendation for a product.
    
    Returns:
    - Optimal price based on elasticity model
    - Expected demand and revenue
    - Revenue uplift percentage
    - Price elasticity and interpretation
    - Optional A/B test variants
    """
    try:
        # Load model
        model_data = load_price_model(product_id)
        
        if model_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"No price optimization model found for product {product_id}. Train models first."
            )
        
        metadata = model_data['metadata']
        elasticity_params = model_data['elasticity_params']
        optimization_result = model_data['optimization_result']
        
        # Generate A/B test variants if requested
        ab_variants = None
        if request.include_ab_tests:
            variants = generate_ab_test_variants(model_data, n_variants=4)
            ab_variants = [ABTestPrice(**v) for v in variants]
        
        # Prepare response
        response = PriceOptimizationResponse(
            product_id=product_id,
            current_price=metadata['current_price'],
            optimal_price=metadata['optimal_price'],
            expected_demand=optimization_result['optimal_demand'],
            expected_revenue=optimization_result['optimal_revenue'],
            revenue_uplift_pct=metadata['revenue_uplift_pct'],
            elasticity=metadata['elasticity'],
            elasticity_interpretation=interpret_elasticity(metadata['elasticity']),
            confidence_interval=metadata['elasticity_ci'],
            ab_test_variants=ab_variants,
            model_metadata={
                'r2_score': metadata['r2_score'],
                'cv_r2_score': metadata['cv_r2_score'],
                'data_points': metadata['data_points'],
                'model_type': metadata['model_type'],
                'features': metadata['features']
            }
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price optimization error: {str(e)}")


@router.post("/product/{product_id}/simulate-bandit", response_model=BanditSimulationResponse)
async def simulate_price_bandit(
    product_id: str,
    request: BanditSimulationRequest = Body(...)
):
    """
    Simulate multi-armed bandit for price testing.
    
    Simulates n days of A/B testing using Thompson Sampling or Epsilon-Greedy
    to find the best price among alternatives.
    """
    try:
        # Load model
        model_data = load_price_model(product_id)
        
        if model_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"No price optimization model found for product {product_id}"
            )
        
        # Run simulation
        if request.algorithm == "thompson":
            results = simulate_thompson_sampling(
                product_id, model_data,
                request.baseline_price, request.test_prices,
                request.n_days
            )
        elif request.algorithm == "epsilon_greedy":
            results = simulate_epsilon_greedy(
                product_id, model_data,
                request.baseline_price, request.test_prices,
                request.n_days, request.epsilon
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid algorithm. Use 'thompson' or 'epsilon_greedy'")
        
        # Generate recommendation
        if results['uplift_pct'] > 5:
            recommendation = f"Strong recommendation: Switch to ${results['best_price']:.2f} (expected {results['uplift_pct']:.1f}% uplift)"
        elif results['uplift_pct'] > 2:
            recommendation = f"Moderate recommendation: Test ${results['best_price']:.2f} (expected {results['uplift_pct']:.1f}% uplift)"
        else:
            recommendation = f"Weak signal: Current price may be optimal (expected {results['uplift_pct']:.1f}% uplift)"
        
        return BanditSimulationResponse(
            product_id=product_id,
            simulation_days=request.n_days,
            algorithm=request.algorithm,
            results=results,
            best_price=results['best_price'],
            expected_uplift_pct=results['uplift_pct'],
            recommendation=recommendation
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@router.post("/experiment/start")
async def start_price_experiment(config: PriceExperimentConfig = Body(...)):
    """
    Start a price experiment (A/B test).
    
    Note: This is a stub. In production, this would:
    1. Validate experiment configuration
    2. Store config in database
    3. Integrate with serving system to split traffic
    4. Set up monitoring and alerts
    """
    # Validate configuration
    if len(config.test_prices) != len(config.traffic_split) - 1:
        raise HTTPException(
            status_code=400,
            detail="traffic_split must have one more element than test_prices (for baseline)"
        )
    
    if abs(sum(config.traffic_split) - 1.0) > 0.01:
        raise HTTPException(
            status_code=400,
            detail="traffic_split must sum to 1.0"
        )
    
    # In production: Store in database
    experiment_id = f"exp_{config.product_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return {
        "experiment_id": experiment_id,
        "status": "created",
        "message": "Experiment configuration saved. Integrate with serving system to activate.",
        "config": config.dict(),
        "warning": "⚠️  This is a stub endpoint. Production implementation required."
    }


@router.get("/experiment/{experiment_id}/status")
async def get_experiment_status(experiment_id: str):
    """
    Get status of a running price experiment.
    
    Note: Stub endpoint. Production would query database and return metrics.
    """
    return {
        "experiment_id": experiment_id,
        "status": "stub",
        "message": "Production implementation required",
        "metrics": {
            "days_running": 0,
            "impressions": 0,
            "conversions": 0,
            "revenue": 0
        }
    }


@router.get("/product/{product_id}/elasticity")
async def get_price_elasticity(product_id: str):
    """
    Get detailed price elasticity information for a product.
    """
    try:
        model_data = load_price_model(product_id)
        
        if model_data is None:
            raise HTTPException(status_code=404, detail="Model not found")
        
        metadata = model_data['metadata']
        elasticity = metadata['elasticity']
        
        return {
            "product_id": product_id,
            "elasticity": elasticity,
            "elasticity_ci": metadata['elasticity_ci'],
            "interpretation": interpret_elasticity(elasticity),
            "model_quality": {
                "r2_score": metadata['r2_score'],
                "cv_r2_score": metadata['cv_r2_score'],
                "data_points": metadata['data_points']
            },
            "recommendations": {
                "elastic": elasticity < -1.0,
                "price_sensitive": elasticity < -0.5,
                "recommendation": (
                    "Lower prices to increase revenue" if elasticity < -1.0
                    else "Higher prices may increase revenue" if elasticity > -0.5
                    else "Test small price changes carefully"
                )
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
