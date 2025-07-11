import { useState } from "react";

const API_URL = import.meta.env.VITE_APP_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;


export default function StudentModal({ student, onClose }) {
  const [formData, setFormData] = useState({ ...student });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (typeof student.__rowId !== "number") {
      showToast("⚠️ Missing row ID");
      return;
    }

    const dataArray = Object.values(formData);
    const encodedData = encodeURIComponent(JSON.stringify(dataArray));
    const rowIndex = student.__rowId;

    const url = `${API_URL}?FN=Update&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&ROWID=${rowIndex}&DATA=${encodedData}`;

    setIsSaving(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      showToast("✅ Student updated!");
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error("Update failed:", err);
      showToast("❌ Failed to update student.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const rowIndex = student.__rowId;
    const url = `${API_URL}?FN=Delete&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&ROWID=${rowIndex}`;

    setIsDeleting(true);
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      showToast("🗑️ Student deleted.");
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete student.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-4 py-2 rounded shadow">
            {toastMessage}
          </div>
        )}

        <h2 className="text-xl mb-4 font-semibold">Edit Student</h2>
        <div className="mb-3 text-sm text-gray-600">
          Editing Row: {student.__rowId}
        </div>

        {/* Fields */}
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

        <div className="flex justify-between mt-6">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => setShowConfirmDelete(true)}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleUpdate}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded">
            <div className="bg-white p-4 rounded shadow-lg max-w-sm w-full">
              <p className="mb-4 text-sm text-gray-800">
                Are you sure you want to delete this student?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-3 py-1 rounded bg-gray-300"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white"
                  onClick={handleDelete}
                >
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
 