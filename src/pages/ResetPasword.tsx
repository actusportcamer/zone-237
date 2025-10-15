import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import logo from '../img/buzz237 logo.png'

export default function ResetPassword() {

  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Detect Supabase password recovery event
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
  }, []);

  const handleUpdatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Password updated successfully!");
      window.location.reload()
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="p-6 border rounded-lg shadow-lg max-w-md w-full">
        <button
            onClick={() => onNavigate('feed')}
            className="flex items-center justify-center mx-auto mb-2 hover:opacity-80 transition-opacity"
          >
             <img src={logo} className='w-16 h-16 mx-auto' />
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          Reset Your Password
        </h2>

        <input
          type="password"
          placeholder="New password"
          className="w-full border p-2 mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleUpdatePassword}
          className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}
