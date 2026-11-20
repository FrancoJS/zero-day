"""Pruebas automáticas del backend (stdlib unittest + TestClient de FastAPI).

Correr desde backend/:   python -m unittest discover -s pruebas -v
En Docker:               docker compose exec backend python -m unittest discover -s pruebas

Nunca llaman a Kostra real ni leen .env: cada prueba fija sus propias variables de entorno
y, para el modo live, usa un servidor falso compatible con OpenAI en 127.0.0.1 (ver apoyo.py).
"""
