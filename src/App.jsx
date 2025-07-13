import { useEffect, useState } from "react";
import CustomerModal from "./CustomerModal";

const API_URL = import.meta.env.VITE_APP_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;
const ITEM_SHEET_NAME = import.meta.env.VITE_CUSTOMER_ITEM;

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    "Customer Name": "",
    "Contact Name": "",
    "Contact Number": "",
    date: "",
    Address: "",
  });

  const [items, setItems] = useState([
    { code: "", description: "", qty: "", rate: "", amount: 0 },
  ]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(
        `${API_URL}?FN=ReadAll&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}`
      );
      const data = await res.json();
      const headers = data[0];
      const rows = data.slice(1).map((row, i) =>
        Object.fromEntries(row.map((cell, j) => [headers[j], cell]))
      );
      rows.forEach((customer, index) => (customer.__rowId = index + 1));
      setCustomers(rows);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, key, value) => {
    const newItems = [...items];
    newItems[index][key] = value;
    const qty = parseFloat(newItems[index].qty) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = qty * rate;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { code: "", description: "", qty: "", rate: "", amount: 0 }]);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const customerId = `CUST-${Date.now()}`;

      const enrichedItems = items.map((item, index) => ({
        ...item,
        itemId: `ITEM-${Date.now()}-${index}`,
        customerId: customerId
      }));

      const itemIds = enrichedItems.map(item => item.itemId).join(",");

      const customerPayload = encodeURIComponent(JSON.stringify([
        customerId,
        formData["Customer Name"],
        formData["Contact Name"],
        formData["Contact Number"],
        formData["date"],
        formData["Address"],
        itemIds
      ]));

      await fetch(
        `${API_URL}?FN=Create&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&DATA=${customerPayload}`
      );

      for (const item of enrichedItems) {
        const itemRow = [
          item.itemId,
          item.code,
          item.description,
          item.qty,
          item.rate,
          item.amount,
          customerId
        ];
        const itemPayload = encodeURIComponent(JSON.stringify(itemRow));
        await fetch(
          `${API_URL}?FN=Create&SHEETID=${SHEET_ID}&SHEETNAME=${ITEM_SHEET_NAME}&DATA=${itemPayload}`
        );
      }

      setFormData({
        "Customer Name": "",
        "Contact Name": "",
        "Contact Number": "",
        date: "",
        Address: "",
      });
      setItems([{ code: "", description: "", qty: "", rate: "", amount: 0 }]);

      showToast("✅ Customer & Items saved successfully!");
      fetchCustomers();
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("❌ Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer).join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-4 max-w-6xl mx-auto relative">
      <h1 className="text-2xl mb-4 font-bold">Customer Management</h1>

      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toastMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Company Name</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" name="Customer Name" placeholder="Customer Name" value={formData["Customer Name"]} onChange={handleChange} required className="border px-2 py-1" />
          <input type="date" name="date" value={formData["date"] || ""} onChange={handleChange} className="border px-2 py-1" />
          <input type="text" name="Address" placeholder="Address" value={formData["Address"]} onChange={handleChange} required className="border px-2 py-1" />
          <input type="text" name="Contact Name" placeholder="Contact Name" value={formData["Contact Name"]} onChange={handleChange} required className="border px-2 py-1" />
          <input type="text" name="Contact Number" placeholder="Mobile" value={formData["Contact Number"]} onChange={handleChange} required className="border px-2 py-1" />
        </div>

        <table className="w-full text-sm border mt-6 mb-2">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Sl#</th>
              <th className="border px-2 py-1">Item Code</th>
              <th className="border px-2 py-1">Item Description</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Rate</th>
              <th className="border px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                <td className="border px-2 py-1">
                  <input type="text" value={item.code} onChange={(e) => handleItemChange(idx, "code", e.target.value)} className="w-full px-1 py-1 border" />
                </td>
                <td className="border px-2 py-1">
                  <input type="text" value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} className="w-full px-1 py-1 border" />
                </td>
                <td className="border px-2 py-1">
                  <input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, "qty", e.target.value)} className="w-full px-1 py-1 border" />
                </td>
                <td className="border px-2 py-1">
                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} className="w-full px-1 py-1 border" />
                </td>
                <td className="border px-2 py-1 text-right">₹ {item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4"></td>
              <td className="border px-2 py-1 font-semibold text-right">Total:</td>
              <td className="border px-2 py-1 text-right font-semibold">₹ {totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <button type="button" onClick={handleAddItem} className="bg-blue-500 text-white px-3 py-1 rounded mb-4">
          ➕ Add Item
        </button>
        <div className="mt-6 flex justify-end space-x-4">
          <button type="button" onClick={() => window.print()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Submit & Print</button>
          <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">{isSubmitting ? "Submitting..." : "Submit"}</button>
          <button type="button" onClick={() => setFormData({ "Customer Name": "", "Contact Name": "", "Contact Number": "", date: "", Address: "" })} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">Close</button>
        </div>
      </form>

      <div className="mb-4 mt-10">
        <input type="text" placeholder="🔍 Search by any field" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border rounded" />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200 text-left">
              {["Customer Name", "Contact Name", "Contact Number", "Address", "date"].map((header) => (
                <th key={header} className="px-4 py-2 border">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <tr key={index} className="hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                <td className="px-4 py-2 border">{customer["Customer Name"]}</td>
                <td className="px-4 py-2 border">{customer["Contact Name"]}</td>
                <td className="px-4 py-2 border">{customer["Contact Number"]}</td>
                <td className="px-4 py-2 border">{customer["Address"]}</td>
                <td className="px-4 py-2 border">{customer["date"]}</td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">No matching customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
