import { useEffect } from 'react'

const DRAG_THRESHOLD = 6

export const useHorizontalDragScroll = (ref, enabled = true) => {
  useEffect(() => {
    const scroller = ref.current
    if (!scroller || !enabled) return

    let pointerId = null
    let startX = 0
    let startScroll = 0
    let dragging = false
    let didDrag = false

    const stopDrag = (event) => {
      if (pointerId == null || event.pointerId !== pointerId) return
      dragging = false
      scroller.classList.remove('is-dragging')
      try {
        scroller.releasePointerCapture(pointerId)
      } catch {
        // Pointer may already be released
      }
      pointerId = null
    }

    const onPointerDown = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      pointerId = event.pointerId
      startX = event.clientX
      startScroll = scroller.scrollLeft
      dragging = true
      didDrag = false
    }

    const onPointerMove = (event) => {
      if (!dragging || event.pointerId !== pointerId) return
      const dx = event.clientX - startX
      if (!didDrag) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return
        didDrag = true
        scroller.classList.add('is-dragging')
        scroller.setPointerCapture(pointerId)
      }
      scroller.scrollLeft = startScroll - dx
    }

    const onClickCapture = (event) => {
      if (!didDrag) return
      event.preventDefault()
      event.stopPropagation()
      didDrag = false
    }

    scroller.addEventListener('pointerdown', onPointerDown)
    scroller.addEventListener('pointermove', onPointerMove)
    scroller.addEventListener('pointerup', stopDrag)
    scroller.addEventListener('pointercancel', stopDrag)
    scroller.addEventListener('click', onClickCapture, true)

    return () => {
      scroller.removeEventListener('pointerdown', onPointerDown)
      scroller.removeEventListener('pointermove', onPointerMove)
      scroller.removeEventListener('pointerup', stopDrag)
      scroller.removeEventListener('pointercancel', stopDrag)
      scroller.removeEventListener('click', onClickCapture, true)
    }
  }, [ref, enabled])
}
