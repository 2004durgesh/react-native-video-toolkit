import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';

/**
 * A `<Profiler>` around a part of the toolkit's UI, for measuring its renders. It's only active in
 * development, and only once a callback is set on `globalThis.__videoToolkitOnRender`; the example
 * app's perf harness (`example/perf`) sets one. Otherwise it renders the children as they are.
 * @internal
 */
export const DevProfiler = ({ id, children }: { id: string; children: ReactNode }) => {
  const onRender: ProfilerOnRenderCallback | undefined = __DEV__
    ? (globalThis as { __videoToolkitOnRender?: ProfilerOnRenderCallback }).__videoToolkitOnRender
    : undefined;

  if (!onRender) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
};
