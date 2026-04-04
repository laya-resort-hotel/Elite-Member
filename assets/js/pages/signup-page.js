import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { signUpWithEmployeeId } from '../services/auth-service.js';
import { showToast } from '../ui/toast.js';

function go(url) {
  window.location.href = url;
}

export function bindSignupPage() {
  if ($('signupBtn') && !$('signupBtn').dataset.bound) {
    $('signupBtn').dataset.bound = '1';
    $('signupBtn').addEventListener('click', async () => {
      if (!state.firebaseReady) {
        showToast('Firebase not ready', 'error');
        return;
      }

      const employeeId = $('signupEmployeeId')?.value.trim();
      const fullName = $('signupFullName')?.value.trim();
      const password = $('signupPassword')?.value || '';
      const confirmPassword = $('signupConfirmPassword')?.value || '';

      if (!employeeId) {
        showToast('กรอกรหัสพนักงานก่อน', 'error');
        return;
      }
      if (!fullName) {
        showToast('กรอกชื่อ-นามสกุลก่อน', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('ยืนยันรหัสผ่านไม่ตรงกัน', 'error');
        return;
      }

      try {
        $('signupBtn').disabled = true;
        await signUpWithEmployeeId({ employeeId, fullName, password });
        showToast('สมัครสมาชิกสำเร็จ ระบบกำลังพาไปหน้าหลังบ้าน');
        setTimeout(() => go('./admin.html'), 600);
      } catch (error) {
        console.error(error);
        let message = error?.message || 'Signup failed';
        if (error?.code === 'auth/email-already-in-use') {
          message = 'รหัสพนักงานนี้ถูกใช้สมัครแล้ว';
        } else if (error?.code === 'auth/weak-password') {
          message = 'รหัสผ่านอ่อนเกินไป';
        }
        showToast(message, 'error');
      } finally {
        $('signupBtn').disabled = false;
      }
    });
  }

  if ($('backToLoginBtn') && !$('backToLoginBtn').dataset.bound) {
    $('backToLoginBtn').dataset.bound = '1';
    $('backToLoginBtn').addEventListener('click', () => go('./index.html'));
  }
}
