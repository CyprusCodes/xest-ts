import atob from "atob";

const parseJWTPayload = (token: string): Record<string, unknown> => {
  try {
    const payload = token.split(".")[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (e) {
    return {};
  }
};

export default parseJWTPayload;
