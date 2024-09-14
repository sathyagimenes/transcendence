#!/bin/bash

mkdir -p logs
openssl req -x509 -newkey rsa:4096 \
    -keyout ./certs/localhost.key -out ./certs/localhost.crt \
    -days 365 -nodes -subj "/C=BR/ST=SP/L=São Paulo/O=42/OU=42/CN=transcendence.42.fr/UID=transcendence"
python manage.py makemessages --all
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
