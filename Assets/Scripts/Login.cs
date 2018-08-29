using System;
using System.Collections;
using System.Collections.Generic;
//using Quobject.SocketIoClientDotNet.Client;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;

public class Login : MonoBehaviour {

	public GameObject LoginGUI;
	public Button LoginBtn;
	public InputField UserName;

	public string path_file = "";

	// Use this for initialization
	void Start () {
		path_file = FlappyScript.path_file;
		LoginBtn.onClick.AddListener(CreateLogin);
	}
	
	// Update is called once per frame
	void Update () {
		
	}

	void CreateLogin()
	{
		string userName = UserName.text;
		if (userName == "")
				return;

		string userID = Guid.NewGuid().ToString();
		string userPWD = Guid.NewGuid().ToString().PadLeft(5);
		string PWD = "";

		foreach (char i in userPWD)
		{
			PWD += i*2;
		}

		FlappyScript.UserID = userID;
		FlappyScript.UserName = userName;

		string token = userName+"/"+userID+"/"+PWD;
		System.IO.File.WriteAllText(path_file, token);
		SendLogin(userName, userID, userPWD, "fbcb_reg");
	}

	public static void SendLogin(string uname, string UID, string PWD, string servicename)
	{
		List<string> inputval = new List<string>() {uname, UID, PWD};
		string request = SocketIOScript.CreateRequest(UID, servicename, inputval);
		SocketIOScript.SSend(servicename, request);
	}

	
}
