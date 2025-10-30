FROM python:3.13.7

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend directory within the build context
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project (from the context) into the container
COPY . .