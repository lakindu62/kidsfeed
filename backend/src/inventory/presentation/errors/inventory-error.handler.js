export function isNotFoundError(error) {
  return (
    typeof error?.message === 'string' && error.message.includes('not found')
  );
}

export function isInvalidObjectIdError(error) {
  return error?.name === 'CastError' && error?.kind === 'ObjectId';
}

export function isBadRequestError(error) {
  return error?.statusCode === 400;
}

export function handleInventoryItemError(res, error, fallbackMessage) {
  if (isInvalidObjectIdError(error)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid inventory item id format',
    });
  }

  if (isBadRequestError(error)) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (isNotFoundError(error)) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
    error: error.message,
  });
}
