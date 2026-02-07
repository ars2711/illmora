const toBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const mapCredentialDescriptors = (items?: Array<{ id: string }>) => {
  if (!items) return items;
  return items.map((item) => ({
    ...item,
    id: fromBase64Url(item.id),
  }));
};

export const normalizePublicKeyOptions = (options: any) => {
  return {
    ...options,
    challenge: fromBase64Url(options.challenge),
    user: options.user
      ? {
          ...options.user,
          id: fromBase64Url(options.user.id),
        }
      : undefined,
    allowCredentials: mapCredentialDescriptors(options.allowCredentials),
    excludeCredentials: mapCredentialDescriptors(options.excludeCredentials),
  };
};

export const credentialToJSON = (credential: Credential) => {
  const publicKeyCred = credential as PublicKeyCredential;
  const response = publicKeyCred.response as AuthenticatorResponse & {
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer | null;
  };

  return {
    id: publicKeyCred.id,
    rawId: toBase64Url(publicKeyCred.rawId),
    type: publicKeyCred.type,
    response: {
      attestationObject: response.attestationObject
        ? toBase64Url(response.attestationObject)
        : undefined,
      authenticatorData: response.authenticatorData
        ? toBase64Url(response.authenticatorData)
        : undefined,
      clientDataJSON: toBase64Url(response.clientDataJSON),
      signature: response.signature
        ? toBase64Url(response.signature)
        : undefined,
      userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
    },
  };
};
