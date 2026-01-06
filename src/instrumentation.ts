import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { setLangfuseTracerProvider } from "@langfuse/tracing";

// Optional: filter out NextJS infra spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

// Create an ISOLATED TracerProvider for Langfuse
// Do NOT use .register() as that would set it as the global provider
// which captures unnamed HTTP request spans
const langfuseTracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

// Register the isolated TracerProvider with Langfuse only
setLangfuseTracerProvider(langfuseTracerProvider);