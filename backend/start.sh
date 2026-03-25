#!/bin/bash
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Cria superusuário se não existir
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'digoribeiro34@email.com', 'Admin12345$')
    print('Superusuário criado')
else:
    print('Superusuário já existe')
"

gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2