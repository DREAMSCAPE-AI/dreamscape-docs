# Monitoring

DreamScape utilise **Prometheus** pour la collecte de métriques et **Grafana** pour la visualisation.

## Architecture

```
Services ──/metrics──▶ Prometheus ──▶ Grafana (dashboards)
                           │
                      Alertmanager ──▶ Notifications
```

## Démarrage

```bash
cd dreamscape-infra/docker
docker compose -f docker-compose.monitoring.yml up -d

# Accès
open http://localhost:9090   # Prometheus
open http://localhost:3030   # Grafana (admin/admin)
```

## Configuration Prometheus

Fichier `dreamscape-infra/monitoring/prometheus.yml` :

```yaml
scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'

  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:3002']

  - job_name: 'voyage-service'
    static_configs:
      - targets: ['voyage-service:3003']

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:3004']

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:3005']
```

## Métriques clés

| Métrique | Description |
|----------|-------------|
| `http_requests_total` | Nombre total de requêtes HTTP |
| `http_request_duration_seconds` | Durée des requêtes (histogramme) |
| `nodejs_heap_used_bytes` | Utilisation mémoire Node.js |
| `nodejs_active_handles_total` | Connexions actives |
| `kafka_producer_messages_sent_total` | Messages Kafka publiés |
| `kafka_consumer_messages_consumed_total` | Messages Kafka consommés |
| `db_query_duration_seconds` | Durée des requêtes Prisma |
| `redis_operations_total` | Opérations Redis |

## Dashboards Grafana

Les dashboards sont configurés dans `dreamscape-infra/monitoring/grafana/` :

| Dashboard | Contenu |
|-----------|---------|
| Services Overview | Santé de tous les services, latences |
| Business Metrics | Réservations, paiements, conversions |
| AI/Recommendations | Recommandations générées, cold start |
| Kafka | Messages par topic, lag consumers |
| Database | Connexions, requêtes lentes |

## Alertes

Alertmanager est configuré pour notifier sur :

- Service down depuis > 2 minutes
- Latence p99 > 500ms pendant 5 minutes
- Taux d'erreur HTTP > 5% pendant 5 minutes
- Kafka consumer lag > 1000 messages
- Mémoire Node.js > 80% pendant 10 minutes

## Health Check endpoint

Chaque service expose `/health` avec des données exploitables par le monitoring :

```json
{
  "status": "healthy",
  "uptime": 3600.5,
  "database": "connected",
  "cache": "connected",
  "kafka": "connected",
  "memory": {
    "used": "150MB",
    "total": "512MB",
    "percentage": 29
  }
}
```
