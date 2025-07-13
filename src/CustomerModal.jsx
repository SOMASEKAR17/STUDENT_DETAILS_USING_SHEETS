import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_APP_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;
const ITEM_SHEET_NAME = import.meta.env.VITE_CUSTOMER_ITEM;

export default function CustomerModal({ customer, onClose }) {
  const [formData, setFormData] = useState({ ...customer });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const deleteItemById = async (itemIdToDelete) => {
  try {
    console.log("called the function");
    const res = await fetch(`${API_URL}?FN=ReadAll&SHEETID=${SHEET_ID}&SHEETNAME=${ITEM_SHEET_NAME}`);
    const data = await res.json();
    const headers = data[0];
    const rows = data.slice(1);

    // Find the row index of the item
    const rowIndex = rows.findIndex((row) => {
      const rowData = Object.fromEntries(row.map((cell, i) => [headers[i], cell]));
      return rowData["Item ID"] === itemIdToDelete;
    });

    console.log("row index:",rowIndex);

    if (rowIndex !== -1) {
      const sheetRowIndex = rowIndex + 1; // +2 because of headers and 1-based index
      console.log("row to be deleted",sheetRowIndex);
      await fetch(
        `${API_URL}?FN=Delete&SHEETID=${SHEET_ID}&SHEETNAME=${ITEM_SHEET_NAME}&ROWID=${sheetRowIndex}`
      );
    }
  } catch (err) {
    console.error(`Failed to delete item with ID ${itemIdToDelete}:`, err);
  }
};




  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}?FN=ReadAll&SHEETID=${SHEET_ID}&SHEETNAME=${ITEM_SHEET_NAME}`);
      const data = await res.json();
      const headers = data[0];
      const rows = data.slice(1).map(row => Object.fromEntries(row.map((cell, i) => [headers[i], cell])));
      const ids = (customer["Item ID's"] || "").split(",").map(id => id.trim());
      const filtered = rows.filter(row => ids.includes(row["Item ID"]));
      setItems(filtered);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);


  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleChange = (e) => {
    if (!isEditing) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (typeof customer.__rowId !== "number") {
      showToast("⚠️ Missing row ID");
      return;
    }

    const rowIndex = customer.__rowId;
    const dataArray = Object.values(formData);
    const encodedData = encodeURIComponent(JSON.stringify(dataArray));

    const url = `${API_URL}?FN=Update&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&ROWID=${rowIndex}&DATA=${encodedData}`;

    setIsSaving(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      showToast("✅ Customer updated!");
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error("Update failed:", err);
      showToast("❌ Failed to update customer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
  const rowIndex = customer.__rowId;
  const itemIds = (customer["Item ID's"] || "").split(",").map(id => id.trim());
  console.log("item ids:",itemIds);

  setIsDeleting(true);

  try {
    // First delete all items one by one
    for (const itemId of itemIds) {
      await deleteItemById(itemId);
    }

    // Then delete the customer row
    const url = `${API_URL}?FN=Delete&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&ROWID=${rowIndex}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());

    showToast("🗑️ Customer and related items deleted.");
    setTimeout(onClose, 1000);
  } catch (err) {
    console.error("Delete failed:", err);
    showToast("❌ Failed to delete customer or items.");
  } finally {
    setIsDeleting(false);
    setShowConfirmDelete(false);
  }
};



  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-xl w-full relative">
        {toastMessage && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-4 py-2 rounded shadow">
            {toastMessage}
          </div>
        )}

        <h2 className="text-xl mb-2 font-semibold">Customer Details</h2>

        {/* Editable Fields */}
        {Object.entries(formData).map(([key, value]) =>
          key !== "__rowId" && key !== "Item ID" && key !== "Item ID's" ? (
            <div key={key} className="mb-3">
              <label className="block text-sm font-medium mb-1">{key}</label>
              <input
                type={key.toLowerCase() === "date" ? "text" : "text"}
                name={key}
                value={key.toLowerCase() === "date" ? formatDate(value) : value || ""}
                readOnly={!isEditing}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${isEditing ? "" : "bg-gray-100 text-gray-600"}`}
              />
            </div>
          ) : null
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Item IDs</label>
          <input
            type="text"
            value={formData["Item ID's"] || ""}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-600"
          />
        </div>



        {/* Item Cards */}
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Items</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.length === 0 && <p className="text-gray-500">No items found.</p>}
            {items.map((item, idx) => (
              <div key={idx} className="border rounded p-3 shadow bg-gray-50">
                <p><strong>Item Code:</strong> {item["Item Code "]}</p>
                <p><strong>Description:</strong> {item["Item Description"]}</p>
                <p><strong>Qty:</strong> {item["Quantity "]}</p>
                <p><strong>Rate:</strong> ₹{item.Rate}</p>
                <p><strong>Amount:</strong> ₹{item.Amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            Close
          </button>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleUpdate}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isSaving}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Confirm Delete Dialog */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded">
            <div className="bg-white p-4 rounded shadow-lg max-w-sm w-full">
              <p className="mb-4 text-sm text-gray-800">
                Are you sure you want to delete this customer?
              </p>
              <div className="flex justify-end gap-3">
                <button className="px-3 py-1 rounded bg-gray-300" onClick={() => setShowConfirmDelete(false)}>
                  Cancel
                </button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
