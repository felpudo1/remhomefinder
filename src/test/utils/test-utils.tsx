import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

export function renderWithClient<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { initialProps?: TProps }
) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return renderHook(hook, { wrapper, ...options });
}
