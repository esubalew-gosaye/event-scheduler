FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt

COPY . /code/

EXPOSE 8000