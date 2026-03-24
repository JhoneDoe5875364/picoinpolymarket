from pydantic import BaseModel


class PiAuthRequest(BaseModel):
    accessToken: str


class AuthResponse(BaseModel):
    access_token: str
    user: dict


class VerifyRequest(BaseModel):
    nonce: str
    authResult: dict


class VerifyResponse(BaseModel):
    customToken: str
    authResult: dict
