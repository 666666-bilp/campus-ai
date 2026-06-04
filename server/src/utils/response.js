/**
 * Standardized API response helpers.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {any} [data=null]
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} [message='Internal Server Error']
 * @param {number} [statusCode=500]
 */
function error(res, message = 'Internal Server Error', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

/**
 * Send a paginated response.
 * @param {import('express').Response} res
 * @param {any[]} data
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
function paginated(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message: 'Success',
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

/**
 * Send a 201 Created success response.
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} [message='Created successfully']
 */
function created(res, data, message = 'Created successfully') {
  return success(res, data, message, 201);
}

module.exports = { success, error, paginated, created };
