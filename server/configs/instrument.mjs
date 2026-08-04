import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: "https://650e8904f5636fdca8099bef15e9ce97@o4511850432233472.ingest.de.sentry.io/4511850436493392",
    sendDefaultPii: true,
});
