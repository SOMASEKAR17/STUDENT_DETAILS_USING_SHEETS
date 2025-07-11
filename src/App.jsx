import { useEffect, useState } from "react";
import StudentModal from "./StudentModal";

const API_URL = import.meta.env.VITE_APP_URL;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;


export default function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formData, setFormData] = useState({
    "First Name": "",
    "Last Name": "",
    "Mobile Number": "",
    "Email ID": "",
    "Branch": "",
    "Address": "",
  });

  const fetchStudents = async () => {
    try {
      const res = await fetch(
        `${API_URL}?FN=ReadAll&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}`
      );
      const data = await res.json();
      const headers = data[0];
      const rows = data.slice(1).map((row, i) =>
        Object.fromEntries(row.map((cell, j) => [headers[j], cell]))
      );
      rows.forEach((student, index) => (student.__rowId = index + 1));
      setStudents(rows);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataStr = encodeURIComponent(JSON.stringify(Object.values(formData)));
      await fetch(
        `${API_URL}?FN=Create&SHEETID=${SHEET_ID}&SHEETNAME=${SHEET_NAME}&DATA=${dataStr}`
      );
      setFormData({
        "First Name": "",
        "Last Name": "",
        "Mobile Number": "",
        "Email ID": "",
        "Branch": "",
        "Address": "",
      });
      showToast("✅ Student created successfully!");
      fetchStudents();
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("❌ Failed to create student");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto relative">
      <h1 className="text-2xl mb-4 font-bold">Student Management</h1>

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toastMessage}
        </div>
      )}

      {/* Create Student Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 mb-6 bg-gray-100 p-4 rounded"
      >
        {Object.keys(formData).map((field) => (
          <div key={field} className="col-span-1">
            <label className="block mb-1 font-semibold">{field}</label>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`col-span-2 text-white py-2 rounded mt-2 ${
            isSubmitting ? "bg-blue-300" : "bg-blue-600"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Student"}
        </button>
      </form>

      {/* Student List */}
      <div className="grid grid-cols-2 gap-4">
        {students.map((student, index) => (
          <div
            key={index}
            className="border p-4 rounded shadow cursor-pointer hover:bg-blue-50"
            onClick={() => setSelectedStudent(student)}
          >
            <p>
              <strong>
                {student["First Name"]} {student["Last Name"]}
              </strong>
            </p>
            <p>{student["Email ID"]}</p>
          </div>
        ))}
      </div>

      {/* Student Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
