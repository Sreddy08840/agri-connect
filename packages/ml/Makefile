.PHONY: help install train serve test clean docker-build docker-run

help:
	@echo "Agri-Connect ML Service - Available Commands"
	@echo "============================================="
	@echo "install          Install dependencies"
	@echo "train            Train all ML models"
	@echo "train-recs       Train recommendation models"
	@echo "train-forecast   Train forecasting models"
	@echo "train-price      Train price optimization models"
	@echo "train-fraud      Train fraud detection models"
	@echo "serve            Start the ML service"
	@echo "serve-dev        Start with auto-reload"
	@echo "test             Run tests"
	@echo "test-cov         Run tests with coverage"
	@echo "lint             Run linting"
	@echo "format           Format code with black"
	@echo "clean            Clean generated files"
	@echo "docker-build     Build Docker image"
	@echo "docker-run       Run Docker container"

install:
	pip install -r requirements.txt

train:
	py -m training.train_all

train-recs:
	py -m training.train_recs

train-forecast:
	py -m training.train_forecast

train-price:
	py -m training.train_price

train-fraud:
	py -m training.train_fraud

serve:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

serve-dev:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest tests/ -v

test-cov:
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

lint:
	flake8 app/ training/ tests/ --max-line-length=120 --exclude=__pycache__

format:
	black app/ training/ tests/ --line-length=120

clean:
	rm -rf __pycache__ app/__pycache__ training/__pycache__ tests/__pycache__
	rm -rf .pytest_cache htmlcov .coverage
	rm -rf models/*.pkl vectors/*.bin vectors/*.pkl
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-build:
	docker build -t agri-connect-ml:latest .

docker-run:
	docker run -p 8000:8000 --env-file .env agri-connect-ml:latest

docker-run-dev:
	docker run -p 8000:8000 -v $(PWD):/app --env-file .env agri-connect-ml:latest
