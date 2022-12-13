$resourceGroup="play14-community"

$registryName="play14containerregistry"
$registryUser=""

$servicePlanName="play14-appserviceplan"
$webAppName="play14-api"

$imageName=$registryName.azurecr.io/$webAppName

$WEBSITES_PORT=1337
$APP_KEYS="<appKey1>,<appKey2>,<appKey3>"
$DATABASE_HOST="<server>.postgres.database.azure.com"
$DATABASE_PORT=5432
$DATABASE_NAME="play14"
$DATABASE_USERNAME="<username>"
$DATABASE_PASSWORD="<pwd>"
$API_TOKEN_SALT="<long random string>"
$ADMIN_JWT_SECRET="<long random string>"
$STORAGE_ACCOUNT=play14storage
$STORAGE_ACCOUNT_KEY="<azure storage access key>"
$STORAGE_CONTAINER_NAME=strapi_uploads

# resource group
# az group create --name myresourceGroup --location westeurope

# container registry
# az acr create --name $registryName --resource-group $resourceGroup --sku Basic --admin-enabled true
# az acr credential show --resource-group $resourceGroup --name $registryUser

# push to registry
# docker login $registryName.azurecr.io --username $registryUser
# docker tag $webAppName $imageName
# az acr repository list -n $registryName

# service plan
# az appservice plan create --name $servicePlanName --resource-group $resourceGroup --is-linux

# webapp
az webapp create --resource-group $resourceGroup --plan $servicePlanName --name $webAppName -i nginx --deployment-container-image-name $imageName

# turn on container logging
az webapp log config --name $webAppName --resource-group $resourceGroup --docker-container-logging filesystem

# appSettings
az webapp config appsettings set --resource-group $resourceGroup --name $webAppName --settings WEBSITES_PORT=$WEBSITES_PORT APP_KEYS=$APP_KEYS DATABASE_HOST=$DATABASE_HOST DATABASE_PORT=$DATABASE_PORT DATABASE_NAME=$DATABASE_NAME DATABASE_USERNAME=$DATABASE_USERNAME DATABASE_USERNAME=$DATABASE_USERNAME DATABASE_PASSWORD=$DATABASE_PASSWORD API_TOKEN_SALT=$API_TOKEN_SALT ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
# az webapp config appsettings set -g $resourceGroup -n $webAppName --settings mySetting=value @appSettings.json

# deploy the image
# az webapp config container set --name $webAppName --resource-group $resourceGroup --docker-custom-image-name $imageName --docker-registry-server-url https://$registryName.azurecr.io


# deployment
# az webapp deployment container config --enable-cd true --name $webAppName --resource-group $resourceGroup

# az webapp config container set --docker-custom-image-name $imageName --docker-registry-server-password StrongPassword --docker-registry-server-url https://$registryName.azurecr.io --docker-registry-server-user DockerUserId --name $webAppName --resource-group $resourceGroup

# delete container config
# az webapp config container delete --name MyWebApp --resource-group MyResourceGroup

# system assigned managed identity
# az webapp identity assign --resource-group $resourceGroup --name $webAppName --query principalId --output tsv
# az account show --query id --output tsv
# az role assignment create --assignee <principal-id> --scope /subscriptions/<subscription-id>/resourceGroups/myResourceGroup/providers/Microsoft.ContainerRegistry/registries/<registry-name> --role "AcrPull"
# az resource update --ids /subscriptions/<subscription-id>/resourceGroups/$resourceGroup/providers/Microsoft.Web/sites/$webAppName/config/web --set properties.acrUseManagedIdentityCreds=True

# enable log stream
az webapp log tail --name $webAppName --resource-group $resourceGroup
