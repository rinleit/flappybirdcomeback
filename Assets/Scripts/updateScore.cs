using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System;
using Newtonsoft.Json;

public class RankInfo{
	public string userName {get; set;}
	public string userId {get; set;}

	public string userBestScore {get; set;}
}
public class updateScore : MonoBehaviour {

	// Use this for initialization
	public Text Rank1, Rank2, Rank3, Rank4, Rank5, Rank6, Rank7, Rank8, Rank9, Rank10, yourRank, yourScore;

	public GameObject RankGUI;

	protected static Queue Queue = new Queue();

	void Start () {
		
	}
	
	// Update is called once per frame
	void Update () {
		lock (Queue)
		{
			if (Queue.Count != 0)
			{
				List<string> element = (List<string>) Queue.Dequeue();
				ShowRank(element);
			}
		}
	}


	public static void submitScore(string UID, int score, int bestscore, string servicename)
	{
		List<string> inputval = new List<string>() {UID, score.ToString(), bestscore.ToString()};
		string request = SocketIOScript.CreateRequest(UID, servicename, inputval);
		SocketIOScript.SSend(servicename, request);
	}

	public void ShowRank(List<string> inputval)
	{
		string userID = FlappyScript.UserID;
		//string userName = FlappyScript.UserName;

		for (int i = 0; i < inputval.Count; i++)
		{
			int rankInt = i + 1;

			var json = JsonConvert.DeserializeObject<RankInfo>(inputval[i]);
			if (json.userId == userID)
			{
				yourRank.text = rankInt.ToString()+".";
				yourScore.text = json.userBestScore;
			}

			switch(rankInt)
			{
				case 1: Rank1.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 2: Rank2.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 3: Rank3.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 4: Rank4.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 5: Rank5.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 6: Rank6.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 7: Rank7.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 8: Rank8.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 9: Rank9.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
				case 10: Rank10.text = String.Format("{0, 10} {1, 10}", json.userName, json.userBestScore);
					break;
			}
		}

		RankGUI.SetActive(true);
	}

	public static void insertShowRankQueue(List<string> inputval)
	{
		Queue.Enqueue(inputval);
	}
}
