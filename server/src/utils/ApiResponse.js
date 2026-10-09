// server/src/utils/ApiResponse.js
// Standardised success response wrapper.
// OWNER: Member 1 — SHARED, do not modify without team agreement.

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static ok(res, data, message = 'Success') {
    return res.status(200).json(new ApiResponse(200, data, message));
  }

  static created(res, data, message = 'Created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
