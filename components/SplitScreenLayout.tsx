"use client";

import { useEffect } from "react";
import { useSplitScreen } from "./SplitScreenProvider";
import { SplitScreenContent } from "./SplitScreenContent";
import { MobileDrawer } from "./MobileDrawer";
import { Panel, Group, Separator } from "react-resizable-panels";

export function SplitScreenLayout({ children }: { children: React.ReactNode }) {
  const {
    splitScreenEnabled,
    iframeUrl,
    originalUrl,
    readerUrl,
    textContent,
    textTitle,
    contentType,
    switchToReaderMode,
    closeSplitScreen,
    isDesktop
  } = useSplitScreen();

  const hasContent = iframeUrl || readerUrl || textContent;
  const showSplitScreen = splitScreenEnabled && hasContent;
  const desktopSplitActive = isDesktop && showSplitScreen;

  // The desktop split shell is a fixed full-viewport layout whose panels scroll
  // internally; lock document scroll so the page itself can't scroll behind it
  // (otherwise a tall panel leaves blank scrollable space below the shell).
  useEffect(() => {
    if (!desktopSplitActive) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [desktopSplitActive]);

  // Desktop: resizable side-by-side panels (only when split screen is enabled).
  // `fixed inset-0` pins the shell to the viewport so it never contributes to or
  // is pushed by document scroll.
  if (desktopSplitActive) {
    return (
      <div className="fixed inset-0 flex overflow-hidden">
        <Group orientation="horizontal" className="flex-1">
          {/* Main content. Outer div is the (non-scrolling) positioned ancestor so
              the page's absolute "+" FAB pins to the panel viewport corner and
              floats above content instead of colliding with the Prev/Next links. */}
          <Panel defaultSize={50} minSize={30}>
            <div className="relative h-full overflow-hidden">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                {children}
              </div>
            </div>
          </Panel>

          {/* Resize handle */}
          <Separator className="w-1 bg-gray-200 hover:bg-purple-400 transition-colors cursor-col-resize" />

          {/* Split screen panel */}
          <Panel defaultSize={50} minSize={30}>
            <SplitScreenContent
              isMobile={false}
              contentType={contentType}
              iframeUrl={iframeUrl}
              originalUrl={originalUrl}
              readerUrl={readerUrl}
              textContent={textContent}
              textTitle={textTitle}
              onClose={closeSplitScreen}
              switchToReaderMode={switchToReaderMode}
            />
          </Panel>
        </Group>
      </div>
    );
  }

  // Mobile: show drawer when split screen is enabled OR there's text content
  const showMobileDrawer = !isDesktop && hasContent && (splitScreenEnabled || textContent !== null);

  return (
    <>
      {children}
      {showMobileDrawer && (
        <MobileDrawer
          isOpen={true}
          onClose={closeSplitScreen}
          contentType={contentType}
          iframeUrl={iframeUrl}
          originalUrl={originalUrl}
          readerUrl={readerUrl}
          textContent={textContent}
          textTitle={textTitle}
          switchToReaderMode={switchToReaderMode}
        />
      )}
    </>
  );
}
