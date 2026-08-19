document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel-wrap').forEach((wrap) => {
    const track = wrap.querySelector('.component-carousel');
    const items = Array.from(track.children);
    const prevButton = wrap.querySelector('.carousel-prev');
    const nextButton = wrap.querySelector('.carousel-next');
    let index = 0;
    let isProgrammaticScroll = false;

    const itemLeftWithinTrack = (item) =>
      item.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;

    // Native scroll clamps at (scrollWidth - clientWidth), which can stop short
    // of the last item's left edge. Pad the track so that position is reachable.
    const ensureScrollRoom = () => {
      track.style.paddingRight = '40px';
      const lastItemLeft = itemLeftWithinTrack(items[items.length - 1]);
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll < lastItemLeft) {
        track.style.paddingRight = `${40 + (lastItemLeft - maxScroll)}px`;
      }
    };

    const updateArrows = () => {
      prevButton.classList.toggle('is-hidden', index <= 0);
    };

    const goTo = (newIndex) => {
      index = Math.max(0, Math.min(items.length - 1, newIndex));
      isProgrammaticScroll = true;
      track.scrollTo({ left: itemLeftWithinTrack(items[index]), behavior: 'smooth' });
      updateArrows();
    };

    // True once the last item needs no further scrolling to be entirely on screen.
    const isLastFullyVisible = () => {
      const last = items[items.length - 1];
      const lastRight = itemLeftWithinTrack(last) + last.getBoundingClientRect().width;
      return lastRight <= track.scrollLeft + track.clientWidth + 1;
    };

    // The next arrow never hides. Once the last image is fully in view it
    // wraps straight back to the first instead of flush-aligning the last one.
    nextButton.addEventListener('click', () => goTo(isLastFullyVisible() ? 0 : index + 1));
    prevButton.addEventListener('click', () => goTo(index - 1));
    window.addEventListener('resize', ensureScrollRoom);

    // Keep arrows in sync with manual swipe/drag scrolling too.
    track.addEventListener(
      'scroll',
      () => {
        if (isProgrammaticScroll) {
          isProgrammaticScroll = false;
          return;
        }
        let closest = 0;
        let closestDistance = Infinity;
        items.forEach((item, i) => {
          const distance = Math.abs(itemLeftWithinTrack(item) - track.scrollLeft);
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = i;
          }
        });
        index = closest;
        updateArrows();
      },
      { passive: true }
    );

    ensureScrollRoom();
    updateArrows();
  });
});
