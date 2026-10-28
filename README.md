# Player Atlas — GitHub Pages

เว็บสถิติข้อมูลจริงจาก Supabase สำหรับ ZERO TRUST SIMULATOR ไม่ต้อง build

## อัปโหลด
1. เปิด repository omniinternship-ai/ZERO-TRUST-SIMULATOR ที่ราก
2. Add file > Upload files แล้วลากโฟลเดอร์ Player-Atlas ในชุดนี้เข้าไปทั้งโฟลเดอร์
3. Commit changes แล้วรอ GitHub Pages deploy สำเร็จ
4. เปิด [https://omniinternship-ai.github.io/ZERO-TRUST-SIMULATOR/Player-Atlas/](https://omniinternship-ai.github.io/Player-Atlas/)

อย่านำ index.html ของชุดนี้ไปทับ index.html ที่รากของเกม เพราะนี่เป็นหน้าเว็บสถิติแยก
ถ้ามี Player-Atlas เดิมอยู่แล้ว ให้อัปเดตไฟล์ในเส้นทางเดิม
GitHub Pages ของ repository ต้องตั้งเป็น main / (root) หรือใช้ workflow ที่เผยแพร่โฟลเดอร์นี้ด้วย

## Supabase
เปิด SQL Editor ของโปรเจกต์เดิม แล้ว Run ไฟล์ supabase/global-stats.sql ทั้งหมดหนึ่งครั้ง (รันซ้ำได้)
ตาราง v003_player_data ต้องมีอยู่ก่อน ไม่มีการเปลี่ยน RLS หรือสิทธิ์อ่านแถวคะแนนเดิม
ฟังก์ชันนี้เผยแพร่ข้อมูลรวมและกลุ่มคะแนนสูงสุดแบบไม่ระบุตัวตน ไม่เผยแพร่ชื่อ อีเมล user ID หรือประวัติคำตอบ
ไม่มีการล็อกอินในเว็บสรุปนี้ จึงไม่ต้องเพิ่ม Google OAuth redirect URL สำหรับ Player-Atlas
config.js มีเพียง publishable key สำหรับหน้าเว็บ ห้ามเปลี่ยนเป็น service_role key

## ข้อมูลบนหน้าเว็บ
จำนวนผู้เล่น = จำนวนบัญชีที่มีบันทึกใน v003_player_data ไม่ใช่จำนวนออนไลน์
อันดับ = 20 กลุ่มคะแนนรวมสูงสุด คะแนนเท่ากันได้อันดับร่วม
ไม่มีข้อมูลตัวอย่าง ไม่มีจุดพิกัดผู้เล่น ไม่ต้องเลือกจังหวัด
รีเฟรชอัตโนมัติทุก60วินาทีเมื่อหน้าเว็บเปิดอยู่ หากยังไม่ติดตั้งSQLจะแจ้งชื่อไฟล์ที่ต้องติดตั้ง
คะแนนเป็นข้อมูลที่เกมส่งขึ้น Supabase ยังไม่มีการตรวจป้องกันโกงฝั่งเซิร์ฟเวอร์

แพ็กเกจนี้เตรียมสำหรับอัปโหลด ยังไม่ได้ push หรือ deploy GitHub ให้จากเครื่องนี้
