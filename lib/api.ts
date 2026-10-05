const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isForm =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      // مع FormData المتصفح يضبط Content-Type بنفسه
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.errors
        ? Object.values(data.errors).flat().join(" ")
        : data?.message || "Something went wrong"
    );
  }

  return data as T;
}

// يفتح ملف محمي (يحتاج توكن) في تبويب جديد
export async function openFile(path: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("Could not open the file");

  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), "_blank");
}