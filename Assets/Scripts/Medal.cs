using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Medal : MonoBehaviour {

	// Use this for initialization
	void Start () {
		
		if (ScoreManagerScript.Score < 20)
		{
			index = 2;
		}
		else if (ScoreManagerScript.Score > 20 && ScoreManagerScript.Score < 60)
		{
			index = 0;
		}
		else
		{
			index = 1;
		}
		
		(GetComponent<Renderer>() as SpriteRenderer).sprite = Medals[index];
	}
	
	// Update is called once per frame
	void Update () {
		
	}

	public Sprite[] Medals;
	public int index;
}
