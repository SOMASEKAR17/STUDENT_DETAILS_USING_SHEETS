import { useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbz9Mi5l-zs-v0xjZ26x0fYJHBkkhFX-_OSK3RU3s6OTo_iLbOKuYyYKe7T_U2obDIpERw/exec";

// Constants
const SHEET_ID = "1y7q3QW8Ibqzo5EFq2Ksloc5gP-TOsWrtQbeSRxntKTc"; // 🔁 Replace with actual sheet ID
const SHEET_NAME = "Records";

export default function StudentModal({ student, onClose }) {
  const [formData, setFormData] = useState({ ...student });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (typeof student.__rowId !== "number") {
      alert("Missing row ID for student. Cannot update.");
      return;
    }

    const dataArray = Object.values(formData); // assumes column order is same

    const encodedData = encodeURIComponent(JSON.stringify(dataArray));
    const rowIndex = student.__rowId; // 0-based index

    const url = `${API_URL}?FN=Update&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&ROWID=${rowIndex}&DATA=${encodedData}`;

    setIsSaving(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      onClose(); // ✅ close and refresh
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update student.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md w-full">
        <h2 className="text-xl mb-4 font-semibold">Edit Student</h2>

        <div className="mb-3 text-sm text-gray-600">
          Editing Row: {student.__rowId}
        </div>

        {Object.entries(formData).map(([key, value]) =>
          key !== "__rowId" ? (
            <div key={key} className="mb-3">
              <label className="block text-sm font-medium mb-1">{key}</label>
              <input
                type="text"
                name={key}
                value={value || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          ) : null
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
