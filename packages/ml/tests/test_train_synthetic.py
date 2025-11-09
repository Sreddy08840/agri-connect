import pandas as pd
import numpy as np

import training.train_recs as tr


def make_products(n=5):
    # Create a small synthetic products dataframe with required columns
    data = {
        'id': [f'p{i}' for i in range(n)],
        'title': [f'Product {i} apple orange' for i in range(n)],
        'description': [f'Description for product {i}' for i in range(n)],
        'category': ['fruit' for _ in range(n)],
    }
    return pd.DataFrame(data)


def test_train_content_based_minimal(monkeypatch, tmp_path):
    # Provide synthetic products via monkeypatching the db accessor
    products_df = make_products(n=5)

    class FakeDB:
        def get_products(self):
            return products_df

    monkeypatch.setattr(tr, 'db', FakeDB())

    # Ensure model_dir exists and is isolated for test
    tr.settings.model_dir = tmp_path / "models"
    tr.settings.model_dir.mkdir(parents=True, exist_ok=True)

    tfidf, matrix, df = tr.train_content_based_model()

    assert tfidf is not None
    assert matrix is not None
    assert df is not None
    assert matrix.shape[0] == len(products_df)
    # vocabulary should be non-empty
    assert len(tfidf.vocabulary_) > 0


def test_train_content_based_single_document(monkeypatch, tmp_path):
    # Single product should not error
    products_df = make_products(n=1)

    class FakeDB:
        def get_products(self):
            return products_df

    monkeypatch.setattr(tr, 'db', FakeDB())

    tr.settings.model_dir = tmp_path / "models"
    tr.settings.model_dir.mkdir(parents=True, exist_ok=True)

    tfidf, matrix, df = tr.train_content_based_model()

    assert tfidf is not None
    assert matrix is not None
    assert matrix.shape == (1, matrix.shape[1])
    assert len(tfidf.vocabulary_) > 0
