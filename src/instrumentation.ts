import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

// Filter out unwanted spans:
// - NextJS infra spans
// - Unnamed/empty spans (the HTTP request wrapper)
const shouldExportSpan: ShouldExportSpan = (span) => {
  const instrumentationName = span.otelSpan.instrumentationScope.name;
  const spanName = span.otelSpan.name;

  // Filter out Next.js infrastructure spans
  if (instrumentationName === "next.js") {
    return false;
  }

  // Filter out unnamed/empty spans (these are auto-created by OTel for HTTP requests)
  if (!spanName || spanName === "Unnamed trace" || spanName.trim() === "") {
    return false;
  }

  return true;
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

// Register globally - this maintains context propagation across async boundaries
tracerProvider.register();