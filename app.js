//npm init -y
// npm install express
// npm install nodemon
// npm install uuid 
// uuidv4();
// npm install cors to allow backend to connect with html using axios
// npm install multer

const express=require("express");
const userDB=require("./db/user.json");
const fs=require("fs");
const { v4: uuidv4 } = require('uuid');

// import connection.js file ==> so it will also work here
const connection = require("./db/connection");
const cors=require("cors");
// server created 
const app=express();
const multer=require('multer');
const { response } = require("express");


const  storage = multer.diskStorage({
  destination: function (req, file, cb) {
      if(file.fieldname=='postImage')
      {
          cb(null, 'public/posts')
      }else{
          cb(null, 'public/user')
      }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+".jpg")
  }
})


function fileFilter (req, file, cb) {
 
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
 
  console.log(file);
  let mimetype=file.mimetype;
  console.log(mimetype);
  if(mimetype.includes('image')){
        // To accept the file pass `true`, like so:
      cb(null, true)
      }
      // To reject this file pass `false`, like so:
      else{
        cb(new Error('Selected file is not a correct image !!!'), false)

  }
 
 
//   // You can always pass an error if something goes wrong:
//   cb()
 
}
const upload = multer({ storage: storage,fileFilter:fileFilter });
  

//api logic

// req = request => from ui,from postman
//res = response => from ui , to postman


//USER DEFINE MIDDLEWARE FUNCTION

// app.use(function(req,res,next){
//     console.log("before express.json()");
//     console.log("Req body==",req.body);
//     next();
// })

//to see data in request body
app.use(express.json())
app.use(cors()); 
// ui application => localhost =>3001 ,backend localhost =>3000
app.use(express.static("public")); 

// app.use(function(req,res,next){
//     console.log("after express.json()");
//     console.log("Req body==",req.body);

//     let allKeys=Object.keys(req.body);
//     // [ 'name', 'password', 'email' ]
//     console.log(allKeys);
//     if(allKeys.length==0)
//     {
//         res.json({
//             message:"Body cannot be empty",
//         })
//     }else{
//         next();
//     }

// })

// app.get("/home",function(req,res){
//     console.log(req.body); 
//     // res.send("welcome to home page!!");
//     res.json({
//         message:"success",
//         data:req.body
//     })
// })
 function insertUser(user)
 {
     return new Promise((resolve,reject)=>{
             let uid=user.uid;
             let name=user.name;
             let email=user.email;
             let bio=user.bio;
             let handle=user.handle;
             let phone=user.phone;
             let isPublic=user.is_public;
             let pImage=user.pImage;
    
             let sql=`INSERT INTO user_table(uid, name, email, phone, bio, handle,is_public,pImage) VALUES ('${uid}','${name}','${email}',${phone},'${bio}','${handle}','${isPublic}','${pImage}')`;
              connection.query(sql,function(err,results){
                if(err)
                reject(err);
                else
                resolve(results);
    
              });

     });

     
 }


//=================
const createUser=async (req,res)=>{
    try{
        // console.log(req.body)
        let user=req.body;
        let uid=uuidv4();
        user.uid=uid;
        let pImage="/user/"+req.file.filename;
        user.pImage=pImage;
        let result =await insertUser(user);//which sql send from back
        
        console.log(user);
        res.json({
            "message":"successfully new user is add",
            "data":result,
        })

    }
    catch(err){

        res.json({
            "message":"User is not defined",
            "data":err,
        })

    }

}
app.post("/user",upload.single('photo'),createUser)
//===================================================
function getUsers(){
    return new Promise(function(resolve,reject){
        let sql=`SELECT * FROM user_table`;
        connection.query(sql,function(error,results){
            if(error)
            reject(error);
            else
            resolve(results);
        })
        

    });
}


const getAllUsers=async (req,res)=>{
    try{
        let users=await getUsers();
        // console.log(users);
        res.json({
            "message":"Successfully get all users !",
            data:users,
        })


    }catch(err){
        res.json({
            "message":"get all users failed",
            error:err
        })
    }
}

app.get("/user",getAllUsers)
//============================

function getUserByIds(uid){
    return new Promise(function(resolve,reject){
        console.log(uid);
        let sql=`SELECT * FROM user_table WHERE uid="${uid}"`;

        connection.query(sql,function(error,results){

            if(error)
            reject(error);
            else if(results.length==0)
            reject(error);
            else
            resolve(results);
        })

    });
}
const getById=async (req,res)=>{
    
    try{
    let uid=req.params.uid;
    // console.log(uid);
    let results=await getUserByIds(uid);
    
        res.json({
            "message":"Successfully we get the data of desire id ",
            "data":results[0],
        })
    
    
    }catch(err)
    {
        res.json({
            "message":"User with this id is not present",
            "error":err,
        })


    }
    


    

    
}
app.get("/user/:uid",getById);
// =============================================


function updateById(updateObject,uid){
    return new Promise(function(resolve,reject){
        let sql=`UPDATE user_table SET`;
        for(key in updateObject)
        {
            sql+=` ${key} = "${updateObject[key]}" ,`
        }
        // DELETE LAST CHARACTER FROM SQL
        sql=sql.slice(0,-1);
        sql+=` WHERE uid= "${uid}"`;

        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            resolve(data); 
        })

        // UPDATE user_table SET
        // name="",bio="",handle="",
        // WHERE uid="",

    })
    
}

// nodejs code => express abstraction
const updateUser=async (req,res)=>{
    try{

        let uid=req.params.uid;
        let updateObject=req.body;
        let pImage="/user/"+req.file.filename;
        updateObject.pImage=pImage;
        let result =await updateById(updateObject,uid);
        console.log(result);
        res.json({
            message:"User updated Successfuly",
            data:result,
        })



    }catch(err){
        res.json({
            message:"Invalid User id",
            error:err,
        })

    }
}

 
app.patch("/user/:uid",upload.single('photo'),updateUser);
// ==============================================

function deleteUserById(uid){
    return new Promise(function(resolve,reject){

        let sql=`DELETE FROM user_table WHERE uid="${uid}"`;
        connection.query(sql,function(error,result){

            if(error)
            reject(error);
            else
            resolve(result);
        })

    })
}

const deleteUser=async (req,res)=>{
    try{
        let uid=req.params.uid;
        let results=await deleteUserById(uid);
        res.json({
            message:"Successfully deleted",
            data:results,
        })

    }
    catch(err){
        res.json({
            message:"user id is not valid",
                error:err
        })
    }

}
app.delete("/user/:uid",deleteUser);
//CREATE READ UPDATE DELETE OPERATIONS (CRUD)
// -----------------------------------------------------------------------
//post a user =>.post => add a user in userDB
// arrow functions
// app.post("/user",createUser)
// get all user 
// app.get("/user",getAllUsers)
// get a user => .get => with the help of uid



// we can send any variable using /:variable to get that id user of anything
// app.get("/user/:uid",getById); 
// update a user =>.patch => update a user with the help of user uid

// app.patch("/user/:uid",updateUser)
// delete a user =>.delete =>delet a user with the help of uid
// app.delete("/user/:uid",deleteUser);




// / REQUESTS START FROM HERE==============================


function addInFollowingTable(obj)
{
    return new Promise((resolve,reject)=>{
        let sql;
        if(obj.isPublic)
        {
            sql=`INSERT INTO user_following(uid,follow_id,is_accepted) VALUES ("${obj.uid}","${obj.followId}", "1");`;
        }
        else{
            sql=`INSERT INTO user_following(uid,follow_id,is_accepted) VALUES ("${obj.uid}","${obj.followId}", "0");`;
        }
        console.log(sql);
        connection.query(sql,function(err,data)
        {
            if(err)
            reject(err);
            else resolve(data);
        })
    })
}


function addInFollowerTable(follower_id,uid)
{
    return new Promise((resolve,reject)=>{
        let sql=`INSERT INTO user_follower(uid,follower_id) VALUES ("${uid}","${follower_id}") ;`;
        console.log(sql);
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            resolve(data);
        })
    })
}

// SEND REQUEST
const sendRequest=async(req,res)=>{
    try{
        let {uid,follow_id}=req.body;
        let user=await getUserByIds(follow_id);
        let isPublic=user[0].is_public;
        if(isPublic)
        {
            // addInFollowingTable
            // addInFollowerTable
            let FollowingResult=await addInFollowingTable({isPublic:true,uid:uid,followId:follow_id});
            let followerResult=await addInFollowerTable(uid,follow_id); 

            res.json({
                message:"request is sent and accepted !",
                data:{FollowingResult,followerResult}
            })


        }else{
            // addInFollowingTable is with is_accepted false

            let followingResult = await addInFollowingTable({
            isPublic: false,
            uid: uid,
            followId: follow_id,
      });
            
      res.json({
                message:"Request send and its pending !",
                data:followingResult
            })

        }
        

    }catch(err)
    {
        res.json({
            message:"Failed to send request",
            error:err
        })
    }
     
}
app.post("/user/request",sendRequest);

//accept request

function acceptFollowRequest(uid,to_be_accepted)
{
    return new Promise((resolve,reject)=>{
         let sql=`UPDATE user_following SET is_accepted=1 WHERE uid="${to_be_accepted}" AND follow_id="${uid}"; `;
         console.log(sql);
         connection.query(sql,function(error,data)
         {
             if(error)
             reject(error);
             else
             resolve(data);
         })
    })

}

const acceptRequest=async (req,res)=>{
   try {
    // object destructing
    let { uid, to_be_accepted } = req.body;
    let acceptData = await acceptFollowRequest(uid, to_be_accepted);
    let followerData = await addInFollowerTable(to_be_accepted, uid);
    res.json({
      message: "Request accepted !",
      data: { acceptData, followerData },
    });

    
  } catch (err) {
    res.json({
      message: "failed to accept request !",
      error: err,
    });
  }
};
app.post("/user/request/accept", acceptRequest);

// sendind pending request
function pendingRequestsId(uid){
    return new Promise((resolve,reject)=>{
        let sql=`SELECT uid FROM user_following WHERE follow_id="${uid}" AND is_accepted=0 ;`;
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            resolve(data);
        })
    })
}

const pendingRequest=async(req,res)=>{
    try{
        let id=req.params.uid;
        let ids=await pendingRequestsId(id);
        let users=[];
        for(let i=0;i<ids.length;i++)
        {
            let user=await getUserByIds(ids[i].uid);
            users.push(user[0]);
        }
        res.json({
        message:"Got pending requests",
        data:users,
    })

    }catch(err){
        res.json({
            message:"Failed to get pending requests !!",
            error:err,
        })
    }
}
app.get("/user/pending/:uid",pendingRequest);

// get following

function getFollowingDetails(uid){
    return new Promise((resolve,reject)=>{
        let sql=`SELECT follow_id FROM user_following where uid="${uid}"`;
        connection.query(sql,(error,data)=>{
            if(error)
            {
                reject(err);
            }
            else resolve(data);
        })
    })
}
app.get("/user/following/:uid",async (req,res)=>{
    try{
        let {uid}=req.params;
        // console.log(uid);
        let followingsData=await getFollowingDetails(uid);
        // console.log(followingsData);
        let users=[];

        for(let i=0;i<followingsData.length;i++)
        {
            let user=await getUserByIds(followingsData[i].follow_id);
            console.log(user[0]);
            users.push(user[0]);

        }
        console.log(users.length);
         res.json({
            message:"get all followings",
            data:users,
        })

    }catch(err)
    {
        res.json({
            message:"invalid uid",
            error:err,
        })
    }

})


// get followers

function getFollowersDetails(uid){
    return new Promise((resolve,reject)=>{
        let sql=`SELECT follower_id FROM user_follower where uid="${uid}"`;
        console.log(sql);
        connection.query(sql,(error,data)=>{
            if(error)
            {
                reject(err);
            }
            else resolve(data);
        })
    })
}
app.get("/user/follower/:uid",async (req,res)=>{
    try{
        let {uid}=req.params;
        // console.log(uid);
        let followersData=await getFollowersDetails(uid);
        // console.log(followersData.length);
        let users=[];
        // console.log(followersData.length);

        for(let i=0;i<followersData.length;i++)
        {
            console.log("hello");
            // console.log(followersData[i]);
            let user=await getUserByIds(followersData[i].follower_id);
            // console.log(user[0]);
            users.push(user[0]);

        }
         res.json({
            message:"get all followers",
            data:users,
        })

    }catch(err)
    {
        res.json({
            message:"invalid uid",
            error:err,
        })
    }

})





// IMAGE UPLOAD





// app.post("/image",upload.single('photo'),function(req,res){
//     console.log(req.body);//text data in json file
//     console.log(req.file);//image in req.file
//     // console.log(req.files);//multiple images comes in req.files

//     res.json({
//         message:"image is uploaded",
//     })
// }) 



// POSTS => create a post,get post by id,get all posts,update a post,delete a post

function createPost(postObject){
    return new Promise((resolve,reject)=>{
        let {pid,uid,postImage,caption}=postObject;
        // console.log(Date.now());
        createDate = new Date().toISOString().slice(0,19).replace('T',' ');
        postObject.createDate=createDate;
        // console.log(postObject); 
        let sql=`INSERT INTO post (pid,uid,postImage,caption,createDate) VALUES('${pid}','${uid}','${postImage}','${caption}',"${createDate}")`;
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else resolve(data);
        })
    })
}
app.post("/post",upload.single("postImage"),async function(req,res){
    try{
        let pid=uuidv4();
        
        let postObject=req.body;
        postObject.pid=pid;
        let postImage="/posts/"+req.file.filename;
        postObject.postImage=postImage;
        let postData=await createPost(postObject);
        console.log(postData);
        res.json({
            message:"post created",
            body:postData,            
        })

    }catch(err)
    {
        res.json({
            message:"photo cannot upload",
            error:err,
        })
    }

})

// ==============================


function getAllPosts(){
    return new Promise((resolve,reject)=>{
        let sql=`SELECT * FROM post ORDER BY createDate DESC`;
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            resolve(data);
        })
    })
}
app.get("/post",async function(req,res){
    try{
        // let postObject=req.params.pid;
        let allPosts=await getAllPosts();
        console.log(allPosts);
        res.json({
            message:"Successfully get all posts",
            body:allPosts,
        })
    }catch(err)
    {
        res.json({
            message:"failed to get all posts",
            error:err,

        })
    }
})


// ================================



function postById(uid){
    return new Promise((response,reject)=>{
        let sql=`SELECT * FROM post WHERE uid="${uid}" ORDER BY createDate DESC`;
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            response(data);
        })

        
    })
}
app.get("/post/:uid",async function(req,res){
    try{
        let uid=req.params.uid;
    let getPostById=await postById(uid);
    res.json({
        message:"Successflly get all posts of given id",
        data:getPostById,
    })

    }
    catch(err)
    {
        res.json({
            message:"failed to get post by id",
            error:err,
        })
    }

})


// update a post

function updatePostOfId(pid,caption){
    return new Promise((resolve,reject)=>{
        let sql=`UPDATE post SET caption="${caption}" WHERE pid="${pid}"`;
        connection.query(sql,function(err,data){
            if(err)
                reject(err);
            else
            resolve(data);

        })
    }) 
}



app.patch("/post",async (req,res)=>{
    try{
        let {pid,caption}=req.body;
        let captionUpdated=await updatePostOfId(pid,caption); 
        res.json({
            message:"caption updated",
            body:captionUpdated,
        })

    }catch(err)
    {
        res.json({
            message:"post with this pid is not available",
            error:err,
        })
    }
})









// delete a post

function deletedPostId(pid){
    return new Promise((response,reject)=>{
        let sql=`DELETE FROM post WHERE pid="${pid}"`
        connection.query(sql,function(err,data){
            if(err)
            reject(err);
            else
            response(data);
        })
    })
}


app.delete("/post/:pid",async (req,res)=>{
    try{
        let pid=req.params.pid;
        let deletedPost=await deletedPostId(pid);
        console.log(deletedPost);
        res.json({
            message:"post is Successfullly deleted",
            data:deletedPost,
        })


    }catch(err){
        res.json({
            message:"unable to delete a post",
            error:err,
        })

    }

})


// user =>create a user,get user by id,get all users ,update a user ,delete a user
// sql=> post table =>pid,uid,caption,postImage,createDate
// POSTS => create a post,get post by id,get all posts,update a post,delete a post pid

//ui component => POSTS =>state >postList >component did mount => get all posts => postList => [{}];
// Post component


let port=process.env.PORT ||4000;
app.listen(port,()=>{
    console.log("Server started at port 4000");
})