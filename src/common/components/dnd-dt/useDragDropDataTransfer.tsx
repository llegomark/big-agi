import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Card, SvgIcon, Typography } from '@mui/joy';

import { themeZIndexDragOverlay } from '~/common/app.theme';

import { useGlobalDragStore } from './volstore-drag-global';


// constants
const zIndexComposerOverlayDrop = 20;
export const EXCLUDE_SELF_TYPE = 'x-app/agi';


// styles

const dragContainerSx: SxProps = {
  position: 'relative', /* for Drop overlay */
} as const;

const dropCardInactiveSx: SxProps = {
  display: 'none',
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: zIndexComposerOverlayDrop,
} as const;

const dropCardDraggingCardSx: SxProps = {
  ...dropCardInactiveSx,
  pointerEvents: undefined,
  outline: '1px dashed', // was border - outline has a 1px rendering offset artifact, but looks better than the opposite which had a -1px offset
  borderRadius: 'sm',
  boxShadow: 'inset 1px 0px 3px -2px var(--joy-palette-success-softColor)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
} as const;

const dropCardPotentialTargetSx: SxProps = {
  ...dropCardDraggingCardSx,
  zIndex: themeZIndexDragOverlay + 1,
  // backgroundColor: 'background.popup',
  // borderStyle: 'none',
  // boxShadow: 'inset 2px 1px 4px -4px var(--joy-palette-success-outlinedColor)',
  // boxShadow: '0 4px 16px 0px var(--joy-palette-background-backdrop)',
  // animation: `${animationEnterModal} 0.2s ease-in-out`,
} as const;


// Drag/Drop that can be used in any component and invokes a DataTransfer callback on success

export function useDragDropDataTransfer(
  enabled: boolean,
  dropText: string, // that the button says
  DropIcon: typeof SvgIcon | null, // icon on the button
  dropVariant: 'largeIcon' | 'startDecorator',
  acceptOnlyFiles: boolean,
  onDropCallback: (dataTransfer: DataTransfer) => Promise<any>,
) {

  // state
  const [isDragging, setIsDragging] = React.useState(false);

  // external state
  const { isWindowDragActive, dragHasFiles } = useGlobalDragStore();

  // derived
  const isPotentialTarget = enabled && isWindowDragActive && !isDragging && (!acceptOnlyFiles || dragHasFiles);


  const _eatDragEvent = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);


  // Container events

  const handleContainerDragEnter = React.useCallback((event: React.DragEvent) => {
    const isFromSelf = event.dataTransfer.types.includes(EXCLUDE_SELF_TYPE);
    if (acceptOnlyFiles) {
      const hasFiles = Array.from(event.dataTransfer.items).some(item => item.kind === 'file');
      if (!hasFiles)
        return;
    }
    if (!isFromSelf) {
      _eatDragEvent(event);
      setIsDragging(true);
    }
  }, [_eatDragEvent, acceptOnlyFiles]);

  const handleContainerDragStart = React.useCallback((event: React.DragEvent) => {
    // This is for drags that originate from the container (e.g. anything within the Textarea's surroundings in Composer)
    event.dataTransfer.setData(EXCLUDE_SELF_TYPE, 'do-not-intercept');
  }, []);


  // Drop Target events

  const _handleDragOver = React.useCallback((event: React.DragEvent) => {
    _eatDragEvent(event);
    // this makes sure we don't "transfer" (or move) the item, but we tell the sender we'll copy it
    event.dataTransfer.dropEffect = 'copy';
  }, [_eatDragEvent]);

  const _handleDragLeave = React.useCallback((event: React.DragEvent) => {
    _eatDragEvent(event);
    setIsDragging(false);
  }, [_eatDragEvent]);

  const _handleDrop = React.useCallback(async (event: React.DragEvent) => {
    _eatDragEvent(event);
    setIsDragging(false);
    await onDropCallback(event.dataTransfer);
  }, [_eatDragEvent, onDropCallback]);


  // Standardized component looks, only customized based on `dropText` and `DropIcon`
  const dropComponent = React.useMemo(() => {
    if (!enabled) return null;

    return (
      <Card
        color={isDragging ? 'success' : isPotentialTarget ? 'success' : undefined}
        variant={isDragging ? 'soft' : isPotentialTarget ? 'soft' : undefined}
        invertedColors={isDragging}
        onDragLeave={_handleDragLeave}
        onDragOver={_handleDragOver}
        onDrop={_handleDrop}
        sx={isDragging ? dropCardDraggingCardSx : isPotentialTarget ? dropCardPotentialTargetSx : dropCardInactiveSx}
      >
        {isDragging && dropVariant === 'largeIcon' && !!DropIcon && (
          <DropIcon sx={{ width: 36, height: 36, pointerEvents: 'none' }} />
        )}
        {isDragging && (
          <Typography
            level='title-sm'
            startDecorator={dropVariant === 'startDecorator' && !!DropIcon && <DropIcon />}
            sx={{ pointerEvents: 'none' }}
          >
            {dropText}
          </Typography>
        )}
        {!isDragging && isPotentialTarget && (
          DropIcon ? (
            <DropIcon sx={{ width: 20, height: 20, pointerEvents: 'none' }} />
          ) : (
            <Typography level='title-sm'>Drop here</Typography>
          )
        )}
      </Card>
    );
  }, [enabled, isPotentialTarget, isDragging, _handleDragLeave, _handleDragOver, _handleDrop, dropVariant, DropIcon, dropText]);


  return {
    dragContainerSx,
    dropComponent,
    handleContainerDragEnter,
    handleContainerDragStart,
    isDragging,
  };
}
