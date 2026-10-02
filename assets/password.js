/* P27 — Firebase Authentication self-service password change. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el=id=>document.getElementById(id);
  function messageFor(error){
    const code=String(error?.code||'').toLowerCase();
    if(code==='auth/wrong-password'||code==='auth/invalid-credential')return'Current password tidak benar.';
    if(code==='auth/requires-recent-login')return'Session perlu reauthentication. Silakan coba lagi dengan current password.';
    if(code==='auth/weak-password')return'Password baru terlalu lemah. Gunakan password yang lebih kuat.';
    if(code==='auth/user-disabled')return'Akun tidak aktif. Hubungi administrator.';
    if(code==='auth/network-request-failed')return'Perubahan password tidak dapat diselesaikan karena gangguan jaringan.';
    if(code==='auth/too-many-requests')return'Terlalu banyak percobaan. Silakan coba lagi nanti.';
    if(code==='auth/user-token-expired')return'Session sudah kedaluwarsa. Silakan sign in kembali.';
    if(code==='auth/requires-recent-login')return'Session perlu diperbarui sebelum password dapat diubah.';
    return error?.authMessage||error?.message||'Password gagal diubah.';
  }
  function validate(newPassword,confirm,username,email){
    if(!newPassword)return'Password baru wajib diisi.';
    if(newPassword.length<10)return'Password baru minimal 10 karakter.';
    if(newPassword.length>128)return'Password baru terlalu panjang.';
    if(/\s/.test(newPassword))return'Password baru tidak boleh mengandung spasi.';
    const p=newPassword.toLowerCase(),u=String(username||'').trim().toLowerCase(),e=String(email||'').trim().toLowerCase();
    if(u&&p===u)return'Password tidak boleh sama dengan username.';
    if(e&&p===e)return'Password tidak boleh sama dengan email.';
    if(e&&p===e.split('@')[0])return'Password tidak boleh sama dengan bagian awal email.';
    if(newPassword!==confirm)return'Password dan konfirmasi harus sama.';
    return'';
  }
  async function markLifecycleComplete(){
    const user=await window.GXFirebase.currentUser();if(!user)return;
    const token=await user.getIdToken(true);
    const response=await fetch('/api/auth-complete-password-change',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({})});
    let payload=null;try{payload=await response.json()}catch(_){ }
    if(!response.ok)throw Object.assign(new Error(payload?.message||'Password berhasil diperbarui, tetapi status lifecycle belum tersinkron.'),{code:payload?.code||'PASSWORD_LIFECYCLE_SYNC_FAILED'});
    return payload;
  }
  async function submit(e){
    e.preventDefault();const form=el('p27PasswordForm'),btn=el('p27PasswordSubmit'),msg=el('p27PasswordMessage'),current=el('p27CurrentPassword'),next=el('p27NewPassword'),confirm=el('p27ConfirmPassword');
    msg.textContent='';msg.className='p27-password-message';
    const user=await window.GXFirebase?.currentUser?.();if(!user){msg.textContent='Session tidak valid. Silakan sign in kembali.';msg.classList.add('error');return}
    const s=window.gxGetSession?.()||{};const err=validate(next.value,confirm.value,s.username,user.email||s.email);if(err){msg.textContent=err;msg.classList.add('error');return}
    if(!current.value){msg.textContent='Current password wajib diisi.';msg.classList.add('error');current.focus();return}
    if(!user.email){msg.textContent='Email authentication belum tersedia untuk akun ini. Hubungi administrator.';msg.classList.add('error');return}
    btn.disabled=true;msg.textContent='Memverifikasi current password…';
    try{
      const credential=window.firebase.auth.EmailAuthProvider.credential(user.email,current.value);
      await user.reauthenticateWithCredential(credential);
      msg.textContent='Memperbarui password…';
      await user.updatePassword(next.value);
      try{await markLifecycleComplete()}catch(syncError){msg.textContent='Password berhasil diperbarui. Status temporary-password masih menunggu sinkronisasi; silakan refresh Profile.';msg.classList.add('success');form.reset();btn.disabled=false;return}
      form.reset();msg.textContent='Password berhasil diperbarui.';msg.classList.add('success');
      const fresh=await window.GXFirebase.currentProfile?.();if(fresh)window.gxSetSession?.({...fresh,uid:user.uid});
      setTimeout(()=>location.replace('profile.html'),700);
    }catch(error){msg.textContent=messageFor(error);msg.classList.add('error')}
    finally{btn.disabled=false}
  }
  function toggle(id,inputId){const b=el(id),i=el(inputId);if(!b||!i)return;b.addEventListener('click',()=>{const show=i.type==='password';i.type=show?'text':'password';b.setAttribute('aria-pressed',show?'true':'false');b.setAttribute('aria-label',show?'Hide password':'Show password')})}
  async function load(){
    const s=window.gxGetSession?.()||{};const user=await window.GXFirebase?.currentUser?.();
    const name=el('p27PasswordAccount');if(name)name.textContent=s.name||s.username||user?.email||'Authenticated User';
    const state=el('p27TempState');if(state)state.innerHTML=s.mustChangePassword?'<span class="gx-status-badge gx-status-warning">Temporary password change required</span>':'<span class="gx-status-badge gx-status-positive">Password self-service available</span>';
    el('p27PasswordForm')?.addEventListener('submit',submit);toggle('p27ToggleCurrent','p27CurrentPassword');toggle('p27ToggleNew','p27NewPassword');toggle('p27ToggleConfirm','p27ConfirmPassword');
  }
  window.GXP27Password={load,validate,messageFor,markLifecycleComplete};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,100));else setTimeout(load,100);
})();
