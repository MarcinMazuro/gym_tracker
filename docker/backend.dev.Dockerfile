FROM python:3.13.7

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend directory
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory contents
COPY backend/ .

EXPOSE 8000

# Use Django development server for local development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
