# Kubernetes Deployment Guide - Airbnb Prototype

## Prerequisites
- Kubernetes cluster (minikube, Docker Desktop Kubernetes, or cloud provider)
- kubectl installed and configured
- Docker images pushed to registry (Docker Hub)

## Step 1: Build and Push Docker Images

```bash
# Build images
docker build -t your-dockerhub-username/auth-service:latest ./auth-service
docker build -t your-dockerhub-username/booking-service:latest ./booking-service
docker build -t your-dockerhub-username/user-service:latest ./user-service
docker build -t your-dockerhub-username/property-service:latest ./property-service

# Push to Docker Hub
docker push your-dockerhub-username/auth-service:latest
docker push your-dockerhub-username/booking-service:latest
docker push your-dockerhub-username/user-service:latest
docker push your-dockerhub-username/property-service:latest
```

## Step 2: Update Image Names

Edit each service YAML file and replace `your-dockerhub-username` with your actual Docker Hub username.

## Step 3: Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/00-namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml

# Deploy infrastructure (MongoDB, Kafka, Zookeeper)
kubectl apply -f k8s/03-mongodb.yaml
kubectl apply -f k8s/04-zookeeper.yaml
kubectl apply -f k8s/05-kafka.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n airbnb --timeout=120s
kubectl wait --for=condition=ready pod -l app=zookeeper -n airbnb --timeout=120s
kubectl wait --for=condition=ready pod -l app=kafka -n airbnb --timeout=120s

# Deploy microservices
kubectl apply -f k8s/06-auth-service.yaml
kubectl apply -f k8s/07-booking-service.yaml
kubectl apply -f k8s/08-user-service.yaml
kubectl apply -f k8s/09-property-service.yaml

# Wait for services to be ready
kubectl wait --for=condition=ready pod -l app=auth-service -n airbnb --timeout=120s
kubectl wait --for=condition=ready pod -l app=booking-service -n airbnb --timeout=120s
```

## Step 4: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n airbnb

# Check services
kubectl get svc -n airbnb

# Check deployments
kubectl get deployments -n airbnb

# View logs
kubectl logs -f deployment/booking-service -n airbnb
kubectl logs -f deployment/user-service -n airbnb
```

## Step 5: Access Services

### Option 1: Port Forward (for testing)
```bash
kubectl port-forward svc/auth-service 5001:5001 -n airbnb
kubectl port-forward svc/booking-service 5004:5004 -n airbnb
```

### Option 2: LoadBalancer (cloud providers)
Change service type to `LoadBalancer` in YAML files.

### Option 3: Ingress (recommended for production)
Create an Ingress resource to route traffic.

## Step 6: Test Kafka Events

```bash
# Access Kafka pod
kubectl exec -it deployment/kafka -n airbnb -- bash

# Inside Kafka pod, consume events
kafka-console-consumer --bootstrap-server localhost:9092 --topic booking-events --from-beginning
```

## Troubleshooting

### View pod logs
```bash
kubectl logs -f <pod-name> -n airbnb
```

### Describe pod for errors
```bash
kubectl describe pod <pod-name> -n airbnb
```

### Check events
```bash
kubectl get events -n airbnb --sort-by='.lastTimestamp'
```

### Delete and redeploy
```bash
kubectl delete -f k8s/
kubectl apply -f k8s/
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace airbnb

# Or delete individual resources
kubectl delete -f k8s/
```

## Notes for Lab 2 Submission

- Take screenshots of `kubectl get pods -n airbnb` showing all pods running
- Take screenshots of `kubectl get svc -n airbnb` showing all services
- Include these YAML files in your submission
- Document any changes made to the manifests