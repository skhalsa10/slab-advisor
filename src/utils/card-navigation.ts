export interface AdjacentCards {
  prevCard: { id: string; name: string } | null;
  nextCard: { id: string; name: string } | null;
}

export function calculateAdjacentCards(
  cardList: Array<{ id: string; name: string }> | undefined,
  currentCardId: string
): AdjacentCards {
  if (!cardList || cardList.length === 0) {
    return { prevCard: null, nextCard: null };
  }

  const currentIndex = cardList.findIndex(card => card.id === currentCardId);
  if (currentIndex === -1) {
    return { prevCard: null, nextCard: null };
  }

  const prevCard = currentIndex > 0 ? cardList[currentIndex - 1] : null;
  const nextCard = currentIndex < cardList.length - 1 ? cardList[currentIndex + 1] : null;

  return { prevCard, nextCard };
}