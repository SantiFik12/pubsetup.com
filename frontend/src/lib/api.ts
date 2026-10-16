export async function createOrder(input: {customer_name: string; email: string; website: string | null; notes: string | null; service_id: string; extension_id: string | null}): Promise<{order_code:string}> {
 const response = await fetch("/api/orders", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(input)});
 const data = await response.json();
 if (!response.ok) throw new Error(data.error ?? "Failed to place order. Please try again.");
 return data;
}
