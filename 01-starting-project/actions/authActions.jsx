'use server'

import { createAuthSession, destroySession } from "@/lib/auth"
import { hashUserPassword, verifyPassword } from "@/lib/hash"
import { createUser, getUserByEmail } from "@/lib/user"
import { redirect } from "next/navigation"

export async function signup(prevState,formData) {
    const email = formData.get('email')
    const password = formData.get('password')

    let errors = {}

    if(!email.includes('@')){
        errors.email = '이메일 형식이 맞지 않습니다.'
    }
    if(password.trim().length < 8) {
        errors.password = '비밀번호가 8자리 이하입니다.'
    }
    console.log(errors)
    if(Object.keys(errors).length > 0){
        return{
            errors : errors
        }
    }
    const hashedPassword = hashUserPassword(password)
    try{
       const id = createUser(email, hashedPassword)
       await createAuthSession(id)
       redirect('/training')
    } catch(error){
        if(error.code=== 'SQLITE_CONSTRAINT_UNIQUE'){
            return{
                errors: {
                    email: '중복되는 이메일입니다.'
                }
            }
        }
        throw error
    }

   
}

export async function login(prevState, formData) {
    const email = formData.get('email')
    const password = formData.get('password')

    const existingUser = getUserByEmail(email)

    if(!existingUser){
        return {
            errors: {
                email: '로그인에 실패하였습니다. 이메일을 확인해주세요' 
            }
        }
    }

    const isVaildPassword = verifyPassword(existingUser.password, password)

    if(!isVaildPassword){
        return {
            errors: {
                password: '로그인에 실패하였습니다. 비밀번호를 확인해주세요' 
            }
        }
    }

    await createAuthSession(existingUser.id)
    redirect('/training')
}
export async function auth(mode, prevState, formData) {
    if(mode === 'login'){
        return login(prevState, formData)
    }
    return signup(prevState, formData)
}
export async function logout() {
   await destroySession();
   redirect('/')
}