import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError} from "../utils/ApiError.js"
import { User } from "../utils/User.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js" 

const registerUser =  asyncHandler( async (req, res) => {
    
        const {fullName,email,username,password} = req.body
        console.log("email:", email)

        // if (fullName === "") {
        //     throw new ApiError(400, "fullName is required")
        // }
        if (
            [fullName, email, username, password].some((field) => field?.trim() === "")
        ){
            throw new ApiError(400, "All fields are required")
        }

       const existedUser = User.findOne({
            $or:[
                { username }, { email }
            ]
        })

        if(existedUser){
            throw new ApiError(409, "User already exists")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        const coverImagePath = req.files?.coverImage[0]?.path;

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar is required")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImagePath)

        if (!avatar){
            throw new ApiError(400, "Avatar upload failed and file is required")
        }

        const user = await User.create({
            fullName,
            email,
            username: username.lowercase(),
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering user")
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser,"User successfully registered")
        )

    
   
})


export { registerUser }