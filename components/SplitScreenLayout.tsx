"use client";

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

  // Desktop: resizable side-by-side panels (only when split screen is enabled)
  if (isDesktop && showSplitScreen) {
    return (
      <div className="h-screen flex overflow-hidden">
        <Group orientation="horizontal" className="flex-1">
          {/* Main content */}
          <Panel defaultSize={50} minSize={30}>
            <div className="relative h-full overflow-y-auto overflow-x-hidden">
              {children}
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
