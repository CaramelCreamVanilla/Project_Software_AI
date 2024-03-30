import React, { useState } from 'react';
import ReactDOM from 'react-dom'; 
import './addusermodal.css';
import Swal from 'sweetalert2';
import { useAuth } from '../../Authentication/authContext';
import axios from 'axios';

const Updateusermodal = ({ onClose , userdata}) => {
    const {updateUser} = useAuth();
    const [file, setFile] = useState(import.meta.env.VITE_API+`/UserProfile/acc_profile/${userdata.account_id}.png`);
    const [filecheck,setFileCheck] = useState(null)
    const [formData, setFormData] = useState({
        account_id: userdata.account_id,
        password: userdata.password,
        name: userdata.name,
        birthDate: userdata.birthDate.split('T')[0],
        phoneNumber: userdata.phoneNumber,
        gender: userdata.gender,
        address: userdata.address,
        roleId: userdata.role_id,
        pId: userdata.p_id,
        occupation: userdata.occupation,
        allergy: userdata.allergy,
        congenitalDisease: userdata.congenital_disease,
    });

    

    const suretoupdate = () => {
        Swal.fire({
            title: "Are you sure ?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update it!",
            customClass: {
                popup: 'my-custom-swal'
            }
        }).then( async (result) => {
            if (result.isConfirmed) {
                await updateUser(formData).then(async ()=>{
                    if(formData.account_id){
                        if(filecheck!=null){
                            await copyfile(formData.account_id)
                        }
                        Swal.fire({
                            title: "Updated!",
                            text: "Your account has been updated.",
                            icon: "success"
                        });
                    }else{
                        Swal.fire({
                            title: "Failed!",
                            text: "Your account could not be updated.",
                            icon: "error" 
                        })
                    }
                }).catch((error)=>{
                    Swal.fire({
                        title: "Error!",
                        text: "Something went wrong: " + error,
                        icon: "error"
                    });
                })
            }
        });
    }

    const copyfile = async (userID) => {
        const formImg = new FormData();
        formImg.append("file", filecheck);
        formImg.append("userID", userID); // You should append userID to the form data like this.
        try {
            const res = await axios.post(import.meta.env.VITE_API + '/uploadimg', formImg); // Send formImg directly.
            if (res.status === 200) { // Status 200 means OK, 204 means No Content.
                console.log('Upload successful', res.data);
            }
        } catch (error) {
            console.error('Error during the upload', error);
        }
    }

    function handlePicChange(e) {
        setFileCheck(e.target.files[0])
        if (e.target.files[0]) { // Check if any file is selected
            const fileURL = URL.createObjectURL(e.target.files[0]);
            setFile(fileURL);
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        suretoupdate();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
          ...prevState,
          [name]: value,
        }));
      };

    const check = () =>{
        console.log(userdata)
    }

    const modalContent = (
        <div className="modal-backdrop">
        <div className="modal-content">

            <p>Update User</p>
            {/* <button onClick={check}>ch</button> */}
            <i className="fa-solid fa-xmark" onClick={onClose}></i>

            <form onSubmit={handleSubmit}>
                <div className="formadduser-header">
                    <div className="picture">
                        <img src={file} alt="" />
                        <div className="file">
                            <input type="file" onChange={handlePicChange} accept=".png,.jpg,.jpeg" />
                        </div>
                    </div>
                    <div className="input-header">
                        <div className="input-group">
                            <label>Role</label>
                            <select name="roleId" required value={formData.roleId} onChange={handleChange} disabled>
                                <option value="">Select Role</option>
                                <option value="P">Patient</option>
                                <option value="N">Nurse</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password} placeholder="Your Password" required pattern=".{3,15}" onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="formadduser">
                    <div className="two-group-horizontal">
                        <div className="input-group">
                            <label>Name</label>
                            <input type="text" name="name" placeholder="Your Name" required pattern="[a-zA-Zก-๏\s]{2,50}" value={formData.name} onChange={handleChange}/>
                        </div>
                        <div className="input-group">
                        <label>Gender</label>
                            <select name="gender" id="gender" value={formData.gender} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="two-group-horizontal">
                        <div className="input-group">
                            <label>Phone</label>
                            <input type="text" name="phoneNumber" placeholder="Your Phone" required pattern="[0-9]{10}" value={formData.phoneNumber} onChange={handleChange}/>
                        </div>
                        <div className="input-group">
                            <label>BirthDate</label>
                            <input type="date" name="birthDate" placeholder="Your birthday" required value={formData.birthDate} onChange={handleChange}/>
                        </div>
                    </div>
                    <div className="one-group-horizontal">
                        <div className="input-group">
                            <label>Address</label>
                            <input type="text" name="address" placeholder="Your Address" required pattern=".{3,150}" value={formData.address} onChange={handleChange}/>
                        </div>
                    </div>
                    {formData.roleId === 'P' &&(
                        <>
                            <div className="one-group-horizontal">
                                <div className="input-group">
                                    <label>CardID</label>
                                    <input type="text" name="pId" placeholder="Your CardID" required pattern="[0-9]{13}" value={formData.pId} onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="two-group-horizontal">
                                <div className="input-group">
                                    <label>Occupation</label>
                                    <input type="text" name="occupation" placeholder="Your Occupation" required pattern=".{2,30}" value={formData.occupation} onChange={handleChange}/>
                                </div>
                                <div className="input-group">
                                    <label>Congenital Disease</label>
                                    <input type="text" name="congenitalDisease" placeholder="Your Congenital Disease" required pattern=".{1,30}" value={formData.congenitalDisease} onChange={handleChange}/>
                                </div>
                            </div>
                            <div className="one-group-horizontal">
                                <div className="input-group">
                                    <label>Allergy</label>
                                    <input type="text" name="allergy" placeholder="Your Allergy" required pattern=".{1,30}" value={formData.allergy} onChange={handleChange}/>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="button-group">
                    <div className="btnadduser">
                        <input type="submit" value="Update" />
                        <input type="button" value="Cancel" onClick={onClose} />
                    </div>
                </div>
            </form>
        </div>
    </div>
);

    return ReactDOM.createPortal(modalContent, document.getElementById('modal-root'));
};

export default Updateusermodal