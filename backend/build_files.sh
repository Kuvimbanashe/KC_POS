#!/bin/sh

echo "BUILD START"
python manage.py migrate --noinput
python manage.py collectstatic --noinput
echo "BUILD END"
