const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const multer = require("../middlewares/multer-config");
const userCtrl = require("../controllers/user");


router.get("/users/birthdays", auth, userCtrl.getBirthdayUsers);
router.get("/users/all/", auth, userCtrl.getAllUsers);
router.get("/users/:id", auth, userCtrl.getUsers);

router.get("/chatsidebarusers/:id", auth, userCtrl.getUsersForChatSideBar);
router.get("/getRandomUserAvatars", userCtrl.getRandomUserAvatars);
router.get("/refresh", auth, userCtrl.refresh);
router.post("/addUser", userCtrl.addUser);
router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.delete("/delete/:id", userCtrl.delete);
router.post("/verify-email", auth, userCtrl.verifyEmail);
router.post("/resendVerificationCode", auth, userCtrl.resendVerificationCode);
router.patch("/update/:id", auth, multer, userCtrl.update);
router.post("/forgetpassword", userCtrl.forgetpassword);
router.patch("/reset-password/:token", multer, userCtrl.reset_password);


// to remove
router.patch("/set-guest", userCtrl.setGuest);
router.patch("/set-jobposition", userCtrl.setUserJobPosition);
router.post("/create-default-weights", userCtrl.createDefaultWeights);
module.exports = router;
