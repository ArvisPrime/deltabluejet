/**
 * Geolocate Cloud Function — Deltablue Jet Air
 *
 * A lightweight HTTP callable that reads the visitor's country
 * from App Engine / Cloud Functions request headers.
 *
 * This is the secondary geo-detection method, used when the
 * primary client-side ipwhois.app call fails.
 *
 * Headers available in Cloud Functions (Gen 2):
 *   x-appengine-country  → ISO 3166-1 alpha-2 (e.g. "NG")
 *   x-appengine-region   → region code
 *   x-appengine-city     → city name
 */

import { onRequest } from 'firebase-functions/v2/https';

export const geolocate = onRequest(
    {
        cors: true,
        region: 'us-central1',
        // Minimal resources — this is a header-reading function
        memory: '128MiB',
        maxInstances: 10,
    },
    (req, res) => {
        // Read country from App Engine / GCP headers
        const countryCode =
            (req.headers['x-appengine-country'] as string) ||
            (req.headers['x-country-code'] as string) ||
            '';

        // ZZ and empty mean "unknown"
        if (!countryCode || countryCode === 'ZZ' || countryCode.length !== 2) {
            res.status(200).json({
                countryCode: null,
                source: 'headers',
                message: 'Country could not be determined from request headers',
            });
            return;
        }

        res.status(200).json({
            countryCode: countryCode.toUpperCase(),
            source: 'headers',
        });
    },
);
