# OpenAPI / Swagger Specifications

Spécifications OpenAPI 3.0.3 complètes pour tous les services DreamScape exposés via le Gateway.

## Fichiers

| Service | Spec | Base URL |
|---------|------|----------|
| Gateway | [gateway.openapi.yaml](gateway.openapi.yaml) | `/` |
| Auth | [auth.openapi.yaml](auth.openapi.yaml) | `/api/v1/auth` |
| User | [user.openapi.yaml](user.openapi.yaml) | `/api/v1/users` + `/api/v1/admin` |
| Voyage | [voyage.openapi.yaml](voyage.openapi.yaml) | `/api/v1/voyage` |
| Payment | [payment.openapi.yaml](payment.openapi.yaml) | `/api/v1/payment` |
| AI | [ai.openapi.yaml](ai.openapi.yaml) | `/api/v1/ai` |

## Visualiser la documentation

### Swagger UI (Docker)

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/specs/gateway.openapi.yaml \
  -v "$(pwd)/dreamscape-docs/api-reference/openapi:/specs" \
  swaggerapi/swagger-ui
# Ouvrir http://localhost:8080
```

### Redocly

```bash
npx @redocly/cli preview-docs dreamscape-docs/api-reference/openapi/auth.openapi.yaml
```

### VS Code

Installer l'extension **Swagger Viewer** (Arjun.swagger-viewer), puis `Shift+Alt+P` sur un fichier `.openapi.yaml`.

## Génération de clients

### TypeScript / Axios

```bash
npx @openapitools/openapi-generator-cli generate \
  -i dreamscape-docs/api-reference/openapi/auth.openapi.yaml \
  -g typescript-axios \
  -o generated/auth-client
```

### Postman Collection

Importer chaque `.openapi.yaml` dans Postman via **Import → File**.

## Validation

```bash
# Linter Spectral
npx @stoplight/spectral-cli lint dreamscape-docs/api-reference/openapi/*.yaml

# Validator officiel
npx @apidevtools/swagger-cli validate dreamscape-docs/api-reference/openapi/auth.openapi.yaml
```

## Conventions

- **Version OpenAPI** : 3.0.3
- **Auth** : `bearerAuth` (JWT) défini globalement, désactivé par endpoint via `security: []` quand l'auth n'est pas requise
- **Format réponse** : `{ success: boolean, data: object, error?: string }` (voir `Envelope` dans chaque spec)
- **Erreurs standard** : 400, 401, 403, 404, 409, 422, 429, 500
- **Servers** : `localhost:3000` (gateway dev), `https://api.dreamscape.app` (production)

## Maintenance

Quand un endpoint change :
1. Mettre à jour le fichier `.openapi.yaml` correspondant
2. Mettre à jour le markdown dans [`api-reference/`](../) (table des endpoints + exemple curl)
3. Re-générer les clients consommateurs si nécessaire
