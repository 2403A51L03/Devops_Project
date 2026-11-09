$ErrorActionPreference = 'Stop'

$context = (kubectl config current-context).Trim()
if ($LASTEXITCODE -ne 0) {
    throw 'Could not determine the current Kubernetes context.'
}
if ($context -ne 'docker-desktop') {
    throw "Switch to the docker-desktop context before loading images. Current context: $context"
}

$nodeOutput = kubectl get nodes -o 'jsonpath={.items[*].metadata.name}'
if ($LASTEXITCODE -ne 0) {
    throw 'Could not list Kubernetes nodes.'
}
$nodes = @($nodeOutput -split '\s+' | Where-Object { $_ })
if ($nodes.Count -eq 0) {
    throw 'No Kubernetes nodes were found.'
}

$images = @(
    @{ Name = 'student-feedback-api:dev'; Archive = 'student-feedback-api.tar' },
    @{ Name = 'student-feedback-client:dev'; Archive = 'student-feedback-client.tar' }
)
$tempDirectory = Join-Path $env:TEMP ("student-feedback-k8s-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempDirectory | Out-Null

try {
    foreach ($image in $images) {
        $archivePath = Join-Path $tempDirectory $image.Archive
        $nodeArchivePath = "/tmp/$($image.Archive)"

        docker image save --output $archivePath $image.Name
        if ($LASTEXITCODE -ne 0) {
            throw "Could not export Docker image $($image.Name)."
        }

        foreach ($node in $nodes) {
            $container = docker inspect $node | ConvertFrom-Json
            if ($LASTEXITCODE -ne 0) {
                throw "Could not find Docker Desktop kind node container '$node'."
            }
            $cluster = $container[0].Config.Labels.PSObject.Properties['io.x-k8s.kind.cluster'].Value
            if (-not $cluster) {
                throw "Docker container '$node' is not a Docker Desktop kind node."
            }

            $transferCommand = 'docker exec -i ' + $node + ' sh -c "cat > ' + $nodeArchivePath + '" < "' + $archivePath + '"'
            & $env:ComSpec /d /c $transferCommand
            if ($LASTEXITCODE -ne 0) {
                throw "Could not transfer $($image.Name) to Kubernetes node '$node'."
            }

            docker exec $node ctr --namespace k8s.io images import $nodeArchivePath
            if ($LASTEXITCODE -ne 0) {
                throw "Could not import $($image.Name) into Kubernetes node '$node'."
            }

            docker exec $node rm -f $nodeArchivePath
            if ($LASTEXITCODE -ne 0) {
                throw "Could not remove the temporary image archive from node '$node'."
            }
        }
    }
} finally {
    Remove-Item -LiteralPath $tempDirectory -Recurse -Force
}

Write-Host 'Both application images are loaded into the Docker Desktop Kubernetes nodes.'
