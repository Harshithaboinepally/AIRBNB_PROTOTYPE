echo $(minikube kubectl -- get service auth-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service property-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service user-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service booking-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service favorite-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service dashboard-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service agent-service -o jsonpath='{.spec.clusterIP}')
echo $(minikube kubectl -- get service ollama -o jsonpath='{.spec.clusterIP}')

