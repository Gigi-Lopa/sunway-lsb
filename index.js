const express = require("express")
const body_parser = require("body-parser")
const {check, validationResult, body } =  require("express-validator")
let cors = require('cors')
let app =  express()
let bcrypt = require('bcrypt');
let sqlite3 = require("sqlite3")
const { json } = require("express")

const urlenCoded = body_parser.urlencoded({extended: true})
app.use(body_parser.json());
let db = new sqlite3.Database("./Database/leavemanagementsystem.sqlite3")

app.use(cors({
    origin : '*'
})) 

let checkEmail =  (email)=> {
    return new Promise((resolve, reject) => {
        try{
            db.serialize(() => {
                db.all(`Select email from emails where email ="${email}"`, (err, rows)=>{
                    console.log(err, rows)
                    if(!err){
                        if(rows.length > 0){
                            return reject(true)
                        }
                        else{
                           return resolve(false)
                        }
                    }
                    else{
                        console.log(err)
                    }
                   })
            })
        }
        catch (e) {
            console.log(e)
            reject(e)
        }
    }) 
}
let insertCredentials =(userId,email, password) =>{
    return new Promise(async(resolve, reject)=>{
        db.serialize(()=>{
            db.run(`
            INSERT INTO emails(userId, email) VALUES (${userId}, "${email}")`, function (err){
                if (err){
                    console.log(err)
                    resolve(false);
                }
                else{
                    db.run(` INSERT INTO passwords(userId, password) VALUES (${userId},"${password}")`, function(err2){
                        if(err2){
                            console.log(err2)
                            resolve(false)
                        }
                        else{
                            resolve(true)
                        }
                    })
                }
            })
        })
    })
}
app.get("/get/requests", (req, res)=>{
    let page = parseInt(req.query.page)
    let limit = 7;
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;
    let numberOfEmployees = 0
    let numberOfDeclinedRequests = 0
    let numberOfAcceptedRequests = 0
    let numberOfPendingRequests = 0
    let allArroundError = false
    let results = []

    db.serialize(async()=>{
        
        db.all("SELECT reqId, fromId, username, leaveType,startDate, endDate, leaveStatus FROM requests ORDER BY reqId DESC", (err, rows)=>{
            results = rows.length < 7 ?  rows :rows.splice(startIndex, endIndex) 
            if(!err){
                db.all("SELECT COUNT(*) FROM requests", (err, rows)=>{
                    if(!err){ 
                        numberOfEmployees = rows[0]['COUNT(*)']
                        db.all(`SELECT COUNT(*) FROM requests WHERE leaveStatus = "PENDING"`, (err, rows)=>{
                            if(!err){
                                numberOfPendingRequests = rows[0]['COUNT(*)']
                                db.all(`SELECT COUNT(*) FROM requests WHERE leaveStatus = "ACCEPTED"`, (err, rows)=>{
                                    if(!err){
                                    numberOfAcceptedRequests = rows[0]['COUNT(*)']
                                    db.all(`SELECT COUNT(*) FROM requests WHERE leaveStatus = "DECLINED"`, (err, rows)=>{
                                        if(!err){
                                            numberOfDeclinedRequests = rows[0]['COUNT(*)']
                                            res.status(200).json({
                                                data : results,
                                                error : false,
                                                numberOfEmployees : numberOfEmployees,
                                                numberOfAcceptedRequests : numberOfAcceptedRequests,
                                                numberOfPendingRequests : numberOfPendingRequests,
                                                numberOfDeclinedRequests :numberOfDeclinedRequests
                                            })
                                        }
                                    })  
                                }
                                })

                            }
                        })
                    }
                    else{
                        console.log(err)
                        res.status(500).json({
                            data : [],
                            error : !false,
                            numberOfEmployees,
                            numberOfAcceptedRequests,
                            numberOfPendingRequests,
                            numberOfDeclinedRequests
                        })
                    }
                })
            }
        })
    })
  
})
app.get("/get/pending/requests", (req, res)=>{
    db.serialize(()=>{
        db.all("SELECT reqId, fromId, username, leaveType,startDate, endDate, leaveStatus FROM requests WHERE leaveStatus = 'PENDING' ORDER BY reqId DESC", (err, rows)=>{
            if(!err){
                let results = rows 
                res.status(200).json({
                    data : results,
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : false
                })
            }
        })
    })
})
app.get("/get/employee/requests", (req, res)=>{
    db.serialize(()=>{
        db.all(`SELECT reqId, fromId, username, leaveType,startDate, endDate FROM requests WHERE fromId = ${req.query.userId} ORDER BY reqId DESC`, (err, rows)=>{
            if(!err){
                let results = rows
                res.status(200).json({
                    data : results,
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : true
                })
            }
        })
    })
})
app.get("/get/accepted/requests", (req, res)=>{
   db.serialize(()=>{
        db.all("SELECT reqId, fromId, username, leaveType,startDate, endDate, leaveStatus FROM requests WHERE leaveStatus = 'ACCEPTED' ORDER BY reqId DESC", (err, rows)=>{
            if(!err){
                let results = rows 
                res.status(200).json({
                    data : results,
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : false
                })
            }
        })
    })
})
app.get("/get/declined/requests", (req, res)=>{
   db.serialize(()=>{
        db.all("SELECT reqId, fromId, username, leaveType,startDate, endDate, leaveStatus FROM requests WHERE leaveStatus = 'DECLINED' ORDER BY reqId DESC", (err, rows)=>{
            if(!err){
                let results = rows 
                res.status(200).json({
                    data : results,
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : false
                })
            }
        })
    })
})
app.get("/get/employees", (req, res)=>{
    let page = parseInt(req.query.page)
    let limit = 10;
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    db.serialize(()=>{
        db.all("SELECT * FROM employees ORDER BY employeeId DESC", (err, rows)=>{
            if(!err){
                let results = rows.length > 1 ? rows.splice(startIndex, endIndex) : rows
                res.status(200).json({
                    data : results,
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : false
                })
            }
        })
    })
})
app.get("/get/request/infor", (req, res)=>{
    db.serialize(()=>{
        db.all(`SELECT * FROM requests WHERE reqId  = ${req.query.reqId}` , (err, rows)=>{
            if(!err){
                res.status(200).json({
                    data : rows[0],
                    error : false
                })
            }
            else{
                res.status(500).json({
                    data : [],
                    error : false
                })
            }
        })
    })
})
app.get("/get/employee/infor", (req, res)=>{
    db.serialize(()=>{
        db.all(`SELECT * FROM employees WHERE employeeId  = ${req.query.userId}` , (err, rows)=>{
            let GENERAL_INFORMATION = rows[0]
            db.all(`SELECT reqId, fromId, username, leaveType,startDate, endDate FROM requests WHERE fromId = ${req.query.userId}`, (err, requests)=>{
                if(!err){
                    res.status(200).json({
                        general_information : GENERAL_INFORMATION,
                        data : requests,
                        error : false
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        general_information : {},
                        data : [],
                        error : false
                    })
                }
            })
          
        })
    })
})
app.get("/get/employee/infor/home", (req, res)=>{
    db.serialize(()=>{
        db.all(`SELECT COUNT(*) FROM requests WHERE fromId  = ${req.query.userId}` , (err, rows)=>{
            let numberOfRequests = rows[0]['COUNT(*)']
            db.all(`SELECT reqId, fromId, username, leaveType,startDate, endDate, leaveStatus FROM requests WHERE fromId = ${req.query.userId} ORDER BY reqId DESC`, (err, requests)=>{
                if(!err){
                    res.status(200).json({
                        numberOfRequests : numberOfRequests,
                        data : requests,
                        error : false
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        general_information : {},
                        data : [],
                        error : false
                    })
                }
            })
          
        })
    })
})
app.get("/update/request", (req, res)=>{
    db.all(`UPDATE requests
    SET leaveStatus = "${req.query.mode === "declined" ? ("DECLINED") : "ACCEPTED"}"
    WHERE reqId = ${req.query.reqId}`, (err, rows)=>{
        if(!err){
            res.status(200).json({
                error : false
            })
        }
        else{
            console.log(err) 
            res.status(500).json({
                error :true
            })
        }
    })
})

app.post("/create/account",[ 
    check("email")
    .custom(async email=>{
        let ifEmailInUse = await checkEmail(email)
        if (ifEmailInUse){
         throw new Error("Email Already in use")
        }
     })
    .withMessage("Invalid Email")
], (req, res)=>{
    let errors = validationResult(req);
    if(errors.errors.length === 0){

        db.serialize(()=>{
            db.run("INSERT into employees(name,  department, cell) VALUES(?,?,?)",
             [
                req.body.name,
                req.body.department,
                req.body.cell,
            
            ],async function (err){
                if(!err){
                    console.log(this.lastID)
                    await  insertCredentials(this.lastID, req.body.email, req.body.password)
                    .then(result=>{
                        if(result){
                            res.status(200).json({
                                "Message" : "No error",
                                "error" : false,
                                "email" : false,
                                "userId" : this.lastID
                            })
                        }
                        else{
                            res.status(500).json({
                                "Message" : "Error Occured",
                                "error" : true,
                                "email" : false,
                            })
                        }
                    })  
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        "Message" : "Error Occured",
                        "error" : true,
                        "email" : false,
                    })
                }
            })
        })
    }
    else{
        console.log(errors)
        res.status(500).json({
            "email" : true,
        })
    }
})
app.post("/create/request/", (req,res)=>{
    db.serialize(()=>{
        db.all(`SELECT name FROM employees WHERE employeeId = ${req.body.userId}`,(err, rows)=>{
            if(!err){
                if(rows.length > 0){
                    let name = rows[0].name;
                    db.all(`
                    INSERT INTO 
                    requests(
                        fromId,
                        userName,
                        leaveType,
                        leaveDescription,
                        startDate,
                        endDate,
                        leaveStatus) 
                    VALUES(${req.body.userId}, "${name}", "${req.body.leaveType}", "${req.body.leaveDescription}", "${req.body.startDate}", "${req.body.endDate}", "PENDING")`
                    , function(err_){
                        res.status(200).json({
                            error : false,
                            insertion : true,
                        })
                    })}
            }
            else{
                res.status(false).json({
                    error : true,
                    insertion : false,
                })
            }
        })
    })
})
app.post("/admin/login",(req, res)=>{
    let password = req.body.password;
    let username = req.body.username;

    db.serialize(()=>{
        db.all(`SELECT * from admin where username = "${username}" AND password = "${password}"`, (err, rows)=>{
            if(!err){
                if(rows.length > 0){
                    res.status(200).json({
                        admin : true,
                        error : false
                    })
                }
                else{
                    res.status(200).json({
                        admin : false,
                        error : false
                    })
                }
            }else{
                res.status(200).json({
                    admin : false,
                    error : true
                })
            }
        })

    })
})
app.post("/employee/login", (req, res)=>{
    let password = req.body.password;

    db.serialize(()=>{
        db.all(`SELECT userId FROM emails WHERE email = "${req.body.email}"`, function(err, rows){
            if(!err){
                if(rows.length > 0){
                    let userId = rows[0].userId
                    db.all(`SELECT password FROM passwords WHERE userId = "${userId}"`,async function(err2, rows2){
                        if(rows2[0].password === password){
                            res.status(200).json({
                                email:true,
                                password : true,
                                error : false,
                                userId : userId
                            })
                        }
                        else{
                            res.status(200).json({
                                email:true,
                                password : false,
                                error : false
                            })
                        }
                    })
                }
                else{
                    res.status(200).json({
                        email:false,
                        password : false,
                        error : false
                    })
                }
            }
        })
    })
})
app.listen(1905,()=>{console.log('http://localhost:1905')})